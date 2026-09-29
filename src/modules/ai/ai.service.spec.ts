import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { AiService } from './ai.service';
import { AI_PROVIDER } from './providers/ai-provider.interface';

describe('AiService', () => {
  const mockRepo: any = { find: jest.fn().mockResolvedValue([]) };

  function svcWith(provider: any) {
    return Test.createTestingModule({
      providers: [
        AiService,
        { provide: AI_PROVIDER, useValue: provider },
        { provide: getRepositoryToken(Service), useValue: mockRepo },
      ],
    }).compile();
  }

  it('recommends success', async () => {
    const provider = {
      name: 'mock',
      model: 'mock-v1',
      recommend: jest.fn().mockResolvedValue({
        analysis: {
          faceShape: 'oval',
          faceShapeConfidence: 0.9,
          hairCharacteristics: {},
          detectedFeatures: ['face'],
          confidence: 0.9,
        },
        recommendations: [
          {
            id: 'a',
            title: 'A',
            titleFa: 'الف',
            category: 'fade',
            length: 'short',
            description: 'd',
            descriptionFa: 'توضیح',
            reason: 'r',
            reasonFa: 'دلیل',
            stylingTips: [],
            stylingTipsFa: [],
            confidence: 0.9,
            suitableFaceShapes: ['oval'],
            maintenance: 'low',
            tags: [],
          },
          {
            id: 'b',
            title: 'B',
            titleFa: 'ب',
            category: 'crop',
            length: 'short',
            description: 'd',
            descriptionFa: 'توضیح',
            reason: 'r',
            reasonFa: 'دلیل',
            stylingTips: [],
            stylingTipsFa: [],
            confidence: 0.8,
            suitableFaceShapes: ['oval'],
            maintenance: 'low',
            tags: [],
          },
        ],
        meta: { provider: 'mock', model: 'mock-v1' },
      }),
    };
    const mod = await svcWith(provider);
    const svc = mod.get(AiService);
    const res = await svc.recommend(Buffer.from('fake'), 'image/jpeg');
    expect(res.recommendations.length).toBe(2);
    expect(res.analysis.faceShape).toBe('oval');
  });

  it('invalid image type', async () => {
    const provider = { name: 'mock', model: 'm', recommend: jest.fn() };
    const mod = await svcWith(provider);
    const svc = mod.get(AiService);
    await expect(
      svc.recommend(Buffer.from('x'), 'text/plain' as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('invalid empty buffer', async () => {
    const provider = { name: 'mock', model: 'm', recommend: jest.fn() };
    const mod = await svcWith(provider);
    const svc = mod.get(AiService);
    await expect(
      svc.recommend(Buffer.alloc(0), 'image/jpeg'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('empty recommendations -> 503', async () => {
    const provider = {
      name: 'mock',
      model: 'm',
      recommend: jest.fn().mockResolvedValue({
        analysis: {
          faceShape: 'oval',
          faceShapeConfidence: 0.8,
          hairCharacteristics: {},
          detectedFeatures: [],
          confidence: 0.8,
        },
        recommendations: [],
        meta: { provider: 'mock', model: 'm' },
      }),
    };
    const mod = await svcWith(provider);
    const svc = mod.get(AiService);
    await expect(
      svc.recommend(Buffer.from('fake'), 'image/jpeg'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('provider throws -> 503', async () => {
    const provider = {
      name: 'mock',
      model: 'm',
      recommend: jest.fn().mockRejectedValue(new Error('boom')),
    };
    const mod = await svcWith(provider);
    const svc = mod.get(AiService);
    await expect(
      svc.recommend(Buffer.from('fake'), 'image/jpeg'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('timeout -> 503', async () => {
    process.env.AI_TIMEOUT_MS = '5';
    const provider = {
      name: 'mock',
      model: 'm',
      recommend: jest.fn().mockImplementation(
        () =>
          new Promise((r) =>
            setTimeout(
              () =>
                r({
                  analysis: {
                    faceShape: 'oval',
                    faceShapeConfidence: 0.8,
                    hairCharacteristics: {},
                    detectedFeatures: [],
                    confidence: 0.8,
                  },
                  recommendations: [
                    {
                      id: 'a',
                      title: 'A',
                      titleFa: 'الف',
                      category: 'fade',
                      length: 'short',
                      description: 'd',
                      descriptionFa: 'توضیح',
                      reason: 'r',
                      reasonFa: 'دلیل',
                      stylingTips: [],
                      stylingTipsFa: [],
                      confidence: 0.9,
                      suitableFaceShapes: ['oval'],
                      maintenance: 'low',
                      tags: [],
                    },
                  ],
                  meta: { provider: 'mock', model: 'm' },
                }),
              100,
            ),
          ),
      ),
    };
    const mod = await svcWith(provider);
    const svc = mod.get(AiService);
    await expect(
      svc.recommend(Buffer.from('fake'), 'image/jpeg'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    delete process.env.AI_TIMEOUT_MS;
  });
});
