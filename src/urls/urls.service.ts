import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import { Url } from './entities/url.entity';
import { CreateUrlDto } from './dto/create-url.dto';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class UrlsService {
  constructor(
    @InjectRepository(Url) private readonly urlRepo: Repository<Url>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly config: ConfigService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async shorten(dto: CreateUrlDto, userId?: string) {
    let shortCode = dto.customCode;
    if (shortCode) {
      const existing = await this.urlRepo.findOne({ where: { shortCode } });
      if (existing) throw new ConflictException('Custom code already taken');
    } else {
      shortCode = nanoid(7);
    }

    const url = new Url();
    url.shortCode = shortCode;
    url.originalUrl = dto.originalUrl;
    url.userId = userId || null;
    url.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    await this.urlRepo.save(url);

    const appUrl = this.config.get('APP_URL');
    return {
      shortCode,
      shortUrl: `${appUrl}/${shortCode}`,
      originalUrl: dto.originalUrl,
      expiresAt: url.expiresAt,
    };
  }

  async resolve(shortCode: string, req: any): Promise<string> {
    const cacheKey = `url:${shortCode}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return cached;

    const url = await this.urlRepo.findOne({ where: { shortCode } });
    if (!url) throw new NotFoundException('Short URL not found');

    if (url.expiresAt && url.expiresAt < new Date()) {
      throw new GoneException('This link has expired');
    }

    await this.cache.set(cacheKey, url.originalUrl, 86400);
    this.analyticsService.recordClick(url.id, req);
    return url.originalUrl;
  }

  async findByUser(userId: string): Promise<Url[]> {
    return this.urlRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async delete(shortCode: string, userId: string): Promise<void> {
    const url = await this.urlRepo.findOne({ where: { shortCode } });
    if (!url) throw new NotFoundException('Short URL not found');
    if (url.userId !== userId) throw new ForbiddenException();
    await this.urlRepo.remove(url);
    await this.cache.del(`url:${shortCode}`);
  }

  async findOneByCode(shortCode: string): Promise<Url | null> {
    return this.urlRepo.findOne({ where: { shortCode } });
  }
}
