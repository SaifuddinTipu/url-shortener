import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, IsNull, Repository } from 'typeorm';
import { Url } from './entities/url.entity';

@Injectable()
export class UrlsScheduler {
  private readonly logger = new Logger(UrlsScheduler.name);

  constructor(
    @InjectRepository(Url) private readonly urlRepo: Repository<Url>,
  ) {}

  @Cron('0 2 * * *')
  async deleteExpiredUrls() {
    const result = await this.urlRepo
      .createQueryBuilder()
      .delete()
      .from(Url)
      .where('expires_at IS NOT NULL AND expires_at < NOW()')
      .execute();
    this.logger.log(`Deleted ${result.affected} expired URLs`);
  }
}
