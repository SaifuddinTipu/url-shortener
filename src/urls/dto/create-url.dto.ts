import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class CreateUrlDto {
  @ApiProperty()
  @IsUrl()
  originalUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 20)
  customCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
