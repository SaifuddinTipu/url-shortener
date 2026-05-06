import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UrlsService } from './urls.service';
import { UrlsController } from './urls.controller';
import { UrlsScheduler } from './urls.scheduler';
import { Url } from './entities/url.entity';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [TypeOrmModule.forFeature([Url]), forwardRef(() => AnalyticsModule)],
  providers: [UrlsService, UrlsScheduler],
  controllers: [UrlsController],
  exports: [UrlsService],
})
export class UrlsModule {}
