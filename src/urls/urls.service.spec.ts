import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { ConflictException, GoneException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { Url } from './entities/url.entity';
import { AnalyticsService } from '../analytics/analytics.service';

const mockRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
});

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    if (key === 'APP_URL') return 'http://localhost:3000';
    return null;
  }),
};

const mockAnalytics = {
  recordClick: jest.fn(),
};

describe('UrlsService', () => {
  let service: UrlsService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlsService,
        { provide: getRepositoryToken(Url), useFactory: mockRepo },
        { provide: CACHE_MANAGER, useValue: mockCache },
        { provide: ConfigService, useValue: mockConfig },
        { provide: AnalyticsService, useValue: mockAnalytics },
      ],
    }).compile();

    service = module.get<UrlsService>(UrlsService);
    repo = module.get(getRepositoryToken(Url));
    jest.clearAllMocks();
  });

  it('shorten() generates a shortCode and returns correct shortUrl', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue({ shortCode: 'abc1234', originalUrl: 'https://example.com', userId: null, expiresAt: null });
    repo.save.mockResolvedValue({});

    const result = await service.shorten({ originalUrl: 'https://example.com' });
    expect(result.shortUrl).toMatch(/http:\/\/localhost:3000\//);
    expect(result.shortCode).toBeDefined();
  });

  it('shorten() uses customCode when provided', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue({ shortCode: 'mycode', originalUrl: 'https://example.com', userId: null, expiresAt: null });
    repo.save.mockResolvedValue({});

    const result = await service.shorten({ originalUrl: 'https://example.com', customCode: 'mycode' });
    expect(result.shortCode).toBe('mycode');
  });

  it('shorten() throws ConflictException if customCode already exists', async () => {
    repo.findOne.mockResolvedValue({ shortCode: 'mycode' });
    await expect(service.shorten({ originalUrl: 'https://example.com', customCode: 'mycode' }))
      .rejects.toThrow(ConflictException);
  });

  it('resolve() returns cached URL on Redis cache hit', async () => {
    mockCache.get.mockResolvedValue('https://cached.com');
    const result = await service.resolve('abc', {} as any);
    expect(result).toBe('https://cached.com');
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('resolve() queries DB and populates cache on cache miss', async () => {
    mockCache.get.mockResolvedValue(null);
    repo.findOne.mockResolvedValue({ id: '1', shortCode: 'abc', originalUrl: 'https://db.com', expiresAt: null });
    mockCache.set.mockResolvedValue(undefined);

    const result = await service.resolve('abc', {} as any);
    expect(result).toBe('https://db.com');
    expect(mockCache.set).toHaveBeenCalledWith('url:abc', 'https://db.com', 86400);
  });

  it('resolve() throws NotFoundException for unknown shortCode', async () => {
    mockCache.get.mockResolvedValue(null);
    repo.findOne.mockResolvedValue(null);
    await expect(service.resolve('unknown', {} as any)).rejects.toThrow(NotFoundException);
  });

  it('resolve() throws GoneException for expired URL', async () => {
    mockCache.get.mockResolvedValue(null);
    repo.findOne.mockResolvedValue({
      id: '1',
      shortCode: 'abc',
      originalUrl: 'https://expired.com',
      expiresAt: new Date('2000-01-01'),
    });
    await expect(service.resolve('abc', {} as any)).rejects.toThrow(GoneException);
  });

  it('delete() throws ForbiddenException when userId does not match URL owner', async () => {
    repo.findOne.mockResolvedValue({ shortCode: 'abc', userId: 'owner-id' });
    await expect(service.delete('abc', 'other-user-id')).rejects.toThrow(ForbiddenException);
  });
});
