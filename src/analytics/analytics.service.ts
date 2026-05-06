import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClickEvent } from './entities/click-event.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ClickEvent)
    private readonly clickEventRepo: Repository<ClickEvent>,
  ) {}

  recordClick(urlId: string, req: any): void {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;
    const userAgent = req.headers['user-agent'];
    const event = this.clickEventRepo.create({ urlId, ip, userAgent });
    this.clickEventRepo.save(event).catch(() => {});
  }

  async getStats(shortCode: string, userId: string, urlsService: any) {
    const url = await urlsService.findOneByCode(shortCode);
    if (!url || url.userId !== userId) {
      const { ForbiddenException } = await import('@nestjs/common');
      throw new ForbiddenException();
    }

    const totalClicks = await this.clickEventRepo.count({
      where: { urlId: url.id },
    });

    const clicksPerDay = await this.clickEventRepo.query(
      `SELECT DATE(clicked_at) as date, COUNT(*)::int as count
       FROM click_events WHERE url_id = $1
       AND clicked_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(clicked_at) ORDER BY date ASC`,
      [url.id],
    );

    const topUserAgents = await this.clickEventRepo
      .createQueryBuilder('ce')
      .select('ce.userAgent', 'userAgent')
      .addSelect('COUNT(*)', 'count')
      .where('ce.urlId = :urlId', { urlId: url.id })
      .groupBy('ce.userAgent')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      shortCode,
      originalUrl: url.originalUrl,
      totalClicks,
      clicksPerDay,
      topUserAgents,
    };
  }
}
