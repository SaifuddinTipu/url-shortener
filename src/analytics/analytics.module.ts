import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { ClickEvent } from './entities/click-event.entity';
import { UrlsModule } from '../urls/urls.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClickEvent]), forwardRef(() => UrlsModule)],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
