import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('urls')
@Controller()
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post('urls')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Shorten a URL (optional auth)' })
  async shorten(@Body() dto: CreateUrlDto, @Req() req: any) {
    return this.urlsService.shorten(dto, req.user?.userId);
  }

  @Get('urls/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my shortened URLs' })
  findByUser(@CurrentUser() user: any) {
    return this.urlsService.findByUser(user.userId);
  }

  @Delete('urls/:code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a shortened URL' })
  delete(@Param('code') code: string, @CurrentUser() user: any) {
    return this.urlsService.delete(code, user.userId);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Redirect to original URL' })
  async redirect(@Param('code') code: string, @Req() req: any, @Res() res: any) {
    const originalUrl = await this.urlsService.resolve(code, req);
    return res.redirect(301, originalUrl);
  }
}
