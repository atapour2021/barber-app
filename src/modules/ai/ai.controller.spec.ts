import { Test } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

describe('AiController', () => {
  const svc: Partial<AiService> = {
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
      ],
      matchedServices: [],
      meta: { provider: 'heuristic', model: 'v1' },
    }),
  };
  it('delegates to service', async () => {
    const mod = await Test.createTestingModule({
      controllers: [AiController],
      providers: [{ provide: AiService, useValue: svc }],
    }).compile();
    const c = mod.get(AiController);
    const file: any = { buffer: Buffer.from('img'), mimetype: 'image/jpeg' };
    const res: any = await c.recommend(file);
    expect(res.recommendations.length).toBe(1);
  });
  it('throws when no file', async () => {
    const mod = await Test.createTestingModule({
      controllers: [AiController],
      providers: [{ provide: AiService, useValue: svc }],
    }).compile();
    const c = mod.get(AiController);
    await expect(c.recommend(null as any)).rejects.toBeTruthy();
  });
});
