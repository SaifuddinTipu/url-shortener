import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UrlsService } from '../urls/urls.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly urlsService: UrlsService,
  ) {}

  @Get(':code')
  @ApiOperation({ summary: 'Get click analytics for a short URL' })
  getStats(@Param('code') code: string, @CurrentUser() user: any) {
    return this.analyticsService.getStats(code, user.userId, this.urlsService);
  }
}
