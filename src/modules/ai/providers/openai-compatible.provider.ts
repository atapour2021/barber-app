import { Injectable, Logger } from '@nestjs/common';
import {
  AiAnalysisResult,
  AiProvider,
  FaceShape,
  HairRecommendation,
} from './ai-provider.interface';
import { HeuristicProvider } from './heuristic.provider';

@Injectable()
export class OpenAiCompatibleProvider implements AiProvider {
  readonly name = 'openai-compatible';
  readonly model: string;
  private readonly logger = new Logger(OpenAiCompatibleProvider.name);
  private readonly fallback = new HeuristicProvider();

  constructor() {
    this.model = process.env.AI_MODEL || 'gpt-4o-mini';
  }

  async preview(
    buffer: Buffer,
    mime: string,
    rec: HairRecommendation,
  ): Promise<string | null> {
    const baseUrl = process.env.AI_API_URL;
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    const baseImg = String(
      process.env.AI_PREVIEW_BASE_URL || baseUrl || '',
    ).replace(/\/$/, '');
    const imgModel =
      process.env.AI_PREVIEW_MODEL || process.env.AI_IMAGE_MODEL || '';
    if (!baseImg || !apiKey || !imgModel) return null;
    const timeoutMs = Number(process.env.AI_PREVIEW_TIMEOUT_MS || 30000);
    const prompt = `Edit ONLY the hairstyle of the person in this exact photo. Keep the SAME person identity, same face shape, facial features, skin tone, eyes, nose, mouth, beard/stubble, neck, clothing, pose, camera angle, lighting, background, and image quality exactly as in the input. Change ONLY the hair to: "${rec.titleFa || rec.title}" — category ${rec.category}, length ${rec.length}. Make the hair look natural, realistic, blended with the existing hairline and scalp, no artifacts, no face distortion, no skin smoothing. Photorealistic, high detail.`;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const fd = new FormData();
      const blob = new Blob([new Uint8Array(buffer)], { type: mime });
      (fd as any).append('image', blob, 'input.jpg');
      (fd as any).append('prompt', prompt);
      (fd as any).append('model', imgModel);
      (fd as any).append('n', '1');
      (fd as any).append('size', '1024x1024');
      const res = await fetch(`${baseImg}/images/edits`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: fd as any,
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        this.logger.warn(`AI preview ${res.status} ${txt.slice(0, 400)}`);
        return null;
      }
      const j: any = await res.json().catch(() => null);
      const b64out: string | undefined =
        j?.data?.[0]?.b64_json || j?.data?.[0]?.b64Json;
      const url: string | undefined = j?.data?.[0]?.url;
      if (b64out) return `data:image/png;base64,${b64out}`;
      if (url) {
        const r2 = await fetch(url);
        if (!r2.ok) return null;
        const buf = Buffer.from(await r2.arrayBuffer());
        return `data:${r2.headers.get('content-type') || 'image/png'};base64,${buf.toString('base64')}`;
      }
      return null;
    } catch (e: any) {
      this.logger.warn(`AI preview failed: ${e?.message ?? e}`);
      return null;
    }
  }

  async recommend(buffer: Buffer, mime: string): Promise<AiAnalysisResult> {
    const baseUrl = process.env.AI_API_URL;
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    if (!baseUrl || !apiKey) return this.fallback.recommend(buffer, mime);
    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 15000);
    try {
      const b64 = buffer.toString('base64');
      const dataUrl = `data:${mime};base64,${b64}`;
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(
        `${baseUrl.replace(/\/$/, '')}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: this.model,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content:
                  'You are a professional barber advisor. Analyze the face photo and return JSON with faceShape (oval|round|square|heart|oblong|diamond|unknown), faceShapeConfidence (0-1), hairCharacteristics {texture,length,density,color}, detectedFeatures string[], and recommendations array (3-5) each with id,title,titleFa,category,length(short|medium|long),description,descriptionFa,reason,reasonFa,stylingTips[],stylingTipsFa[],confidence(0-1),suitableFaceShapes[],maintenance(low|medium|high),tags[]. Persian translations required for titleFa/descriptionFa/reasonFa/stylingTipsFa. Respond JSON only.',
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Analyze this face and recommend hairstyles. Return JSON only.',
                  },
                  { type: 'image_url', image_url: { url: dataUrl } },
                ],
              },
            ],
            max_tokens: 1200,
            temperature: 0.4,
          }),
        },
      );
      clearTimeout(t);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        this.logger.warn(`AI provider ${res.status} ${txt.slice(0, 300)}`);
        return this.fallback.recommend(buffer, mime);
      }
      const json: any = await res.json();
      const content: string = json?.choices?.[0]?.message?.content ?? '';
      const parsed = extractJson(content);
      if (!parsed?.recommendations?.length)
        return this.fallback.recommend(buffer, mime);
      return normalize(parsed, this.name, this.model);
    } catch (e: any) {
      this.logger.warn(`AI provider failed: ${e?.message ?? e}`);
      return this.fallback.recommend(buffer, mime);
    }
  }
}

function extractJson(s: string): any {
  try {
    return JSON.parse(s);
  } catch {}
  const m = s.match(/\{[\s\S]*\}/);
  if (m)
    try {
      return JSON.parse(m[0]);
    } catch {}
  return null;
}

function normalize(p: any, provider: string, model: string): AiAnalysisResult {
  const faceShape =
    (String(
      p.faceShape || p.analysis?.faceShape || 'unknown',
    ).toLowerCase() as FaceShape) || 'unknown';
  const recs: HairRecommendation[] = (p.recommendations || p.styles || [])
    .slice(0, 5)
    .map((r: any, i: number) => ({
      id: String(r.id ?? `rec-${i}`),
      title: String(r.title ?? r.name ?? `Style ${i + 1}`),
      titleFa: String(r.titleFa ?? r.title ?? `استایل ${i + 1}`),
      category: String(r.category ?? 'general'),
      length: ['short', 'medium', 'long'].includes(String(r.length))
        ? r.length
        : 'medium',
      description: String(r.description ?? ''),
      descriptionFa: String(r.descriptionFa ?? r.description ?? ''),
      reason: String(r.reason ?? ''),
      reasonFa: String(r.reasonFa ?? r.reason ?? ''),
      stylingTips: Array.isArray(r.stylingTips)
        ? r.stylingTips.map(String)
        : [],
      stylingTipsFa: Array.isArray(r.stylingTipsFa)
        ? r.stylingTipsFa.map(String)
        : Array.isArray(r.stylingTips)
          ? r.stylingTips.map(String)
          : [],
      confidence:
        typeof r.confidence === 'number' ? r.confidence : 0.8 - i * 0.05,
      suitableFaceShapes: Array.isArray(r.suitableFaceShapes)
        ? r.suitableFaceShapes
        : [faceShape],
      maintenance: ['low', 'medium', 'high'].includes(String(r.maintenance))
        ? r.maintenance
        : 'medium',
      tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    }));
  return {
    analysis: {
      faceShape: faceShape,
      faceShapeConfidence: Number(
        p.faceShapeConfidence ?? p.analysis?.faceShapeConfidence ?? 0.7,
      ),
      hairCharacteristics:
        p.hairCharacteristics ?? p.analysis?.hairCharacteristics ?? {},
      detectedFeatures: Array.isArray(p.detectedFeatures)
        ? p.detectedFeatures
        : (p.analysis?.detectedFeatures ?? ['face']),
      confidence: Number(p.confidence ?? 0.7),
    },
    recommendations: recs,
    meta: { provider, model },
  };
}
