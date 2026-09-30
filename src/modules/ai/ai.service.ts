import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../services/entities/service.entity';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import type {
  AiAnalysisResult,
  AiProvider,
  HairRecommendation,
} from './providers/ai-provider.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
    @InjectRepository(Service) private readonly svcRepo: Repository<Service>,
  ) {}

  async recommend(
    buffer: Buffer,
    mime: string,
  ): Promise<AiAnalysisResult & { matchedServices: Service[] }> {
    if (!buffer?.length) throw new BadRequestException('image required');
    if (!mime?.startsWith('image/'))
      throw new BadRequestException('only images allowed');
    if (buffer.length > 5 * 1024 * 1024)
      throw new BadRequestException('image too large (max 5MB)');
    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 15000);
    let result: AiAnalysisResult;
    try {
      result = await withTimeout(
        this.provider.recommend(buffer, mime),
        timeoutMs,
        'AI provider timeout',
      );
    } catch (e: any) {
      if (e?.message === 'AI provider timeout')
        throw new ServiceUnavailableException('AI service timeout, try again');
      this.logger.warn(`AI recommend failed: ${e?.message ?? e}`);
      throw new ServiceUnavailableException(
        'AI service unavailable, try again',
      );
    }
    if (!result?.recommendations?.length)
      throw new ServiceUnavailableException('AI returned no recommendations');
    const matchedServices = await this.matchServices(result);
    return { ...result, matchedServices };
  }

  async preview(
    buffer: Buffer,
    mime: string,
    rec: HairRecommendation,
  ): Promise<{ previewImage: string; mime: string }> {
    if (!buffer?.length) throw new BadRequestException('image required');
    if (!mime?.startsWith('image/'))
      throw new BadRequestException('only images allowed');
    if (buffer.length > 5 * 1024 * 1024)
      throw new BadRequestException('image too large (max 5MB)');
    const fn = (this.provider as AiProvider & { preview?: unknown }).preview;
    const timeoutMs = Number(process.env.AI_PREVIEW_TIMEOUT_MS || 30000);
    if (typeof fn === 'function') {
      try {
        const out: string | null = await withTimeout(
          fn.call(this.provider, buffer, mime, rec) as Promise<string | null>,
          timeoutMs,
          'AI preview timeout',
        );
        if (out) {
          return {
            previewImage: out,
            mime: out.startsWith('data:')
              ? out.slice(5, out.indexOf(';')) || mime
              : mime,
          };
        }
      } catch (e: any) {
        if (e?.message !== 'AI preview timeout')
          this.logger.warn(`AI preview failed: ${e?.message ?? e}`);
      }
    }
    return {
      previewImage: `data:${mime};base64,${buffer.toString('base64')}`,
      mime,
    };
  }

  private async matchServices(result: AiAnalysisResult): Promise<Service[]> {
    try {
      const all = await this.svcRepo.find({
        order: { createdAt: 'DESC' } as any,
        take: 50,
      });
      if (!all.length) return [];
      const keywords = new Set<string>();
      for (const r of result.recommendations) {
        for (const t of [...(r.tags ?? []), r.category, r.title, r.titleFa]) {
          String(t || '')
            .toLowerCase()
            .split(/[\s,_-]+/)
            .forEach((w) => w && keywords.add(w));
        }
      }
      const kw = Array.from(keywords).filter(Boolean);
      const scored = all.map((s) => {
        const hay =
          `${s.name} ${s.description ?? ''} ${s.icon ?? ''}`.toLowerCase();
        let score = 0;
        for (const k of kw) if (k.length >= 2 && hay.includes(k)) score++;
        if (
          hay.includes('کوتاه') ||
          hay.includes('cut') ||
          hay.includes('fade')
        )
          score += kw.some((k) => ['fade', 'cut', 'short'].includes(k)) ? 1 : 0;
        return { s, score };
      });
      scored.sort((a, b) => b.score - a.score);
      const top = scored
        .filter((x) => x.score > 0)
        .slice(0, 6)
        .map((x) => x.s);
      return top.length ? top : all.slice(0, 3);
    } catch {
      return [];
    }
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  let t: NodeJS.Timeout;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error(msg)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(t));
}
