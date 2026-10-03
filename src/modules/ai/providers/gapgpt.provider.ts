import { Injectable, Logger } from '@nestjs/common';
import {
  AiAnalysisResult,
  AiProvider,
  BusinessInsightsInput,
  BusinessInsightsResult,
  CustomerProfileInput,
  CustomerProfileResult,
  FaceShape,
  HairRecommendation,
  ServiceRecommendInput,
  ServiceRecommendation,
  SmartReminderInput,
  SmartReminderResult,
} from './ai-provider.interface';
import { HeuristicProvider } from './heuristic.provider';
const TEHRAN_TZ = 'Asia/Tehran';
function tehranYMD(d: Date | string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TEHRAN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(d));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isRetryable = (status: number, body: string) =>
  [429, 500, 502, 503, 504].includes(status) ||
  body.includes('system_error') ||
  body.includes('try again');

@Injectable()
export class GapGptProvider implements AiProvider {
  readonly name = 'gapgpt';
  readonly model: string;
  private readonly logger = new Logger(GapGptProvider.name);
  private readonly fallback = new HeuristicProvider();
  constructor() {
    this.model = process.env.AI_MODEL || 'gpt-4o-mini';
  }
  async preview(
    buffer: Buffer,
    mime: string,
    rec: HairRecommendation,
  ): Promise<string | null> {
    const base = String(
      process.env.AI_API_URL || 'https://api.gapgpt.app/v1',
    ).replace(/\/$/, '');
    const apiKey = process.env.AI_API_KEY || '';
    const imgModel =
      process.env.AI_PREVIEW_MODEL ||
      process.env.AI_IMAGE_MODEL ||
      'gpt-image-1';
    if (!apiKey) return null;
    const timeoutMs = Number(process.env.AI_PREVIEW_TIMEOUT_MS || 30000);
    const retries = Number(process.env.AI_PREVIEW_RETRIES || 2);
    const prompt = `Edit ONLY the hairstyle of the person in this exact photo. Keep SAME identity, face, skin, beard, clothing, pose, lighting, background. Change ONLY hair to "${rec.titleFa || rec.title}" category ${rec.category} length ${rec.length}. Photorealistic, natural blend at hairline, no face distortion.`;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), timeoutMs);
        const fd = new FormData();
        (fd as any).append(
          'image',
          new Blob([new Uint8Array(buffer)], { type: mime }),
          'input.jpg',
        );
        (fd as any).append('prompt', prompt);
        (fd as any).append('model', imgModel);
        (fd as any).append('n', '1');
        (fd as any).append('size', '1024x1024');
        let res = await fetch(`${base}/images/edits`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}` },
          body: fd as any,
          signal: ctrl.signal,
        });
        if (!res.ok && res.status === 404) {
          res = await fetch(`${base}/images/generations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: imgModel,
              prompt,
              n: 1,
              size: '1024x1024',
            }),
            signal: ctrl.signal,
          });
        }
        clearTimeout(t);
        if (res.ok) {
          const j: any = await res.json().catch(() => null);
          const b64: string | undefined =
            j?.data?.[0]?.b64_json || j?.data?.[0]?.b64Json;
          const url: string | undefined = j?.data?.[0]?.url;
          if (b64) return `data:image/png;base64,${b64}`;
          if (url) {
            const r2 = await fetch(url);
            if (!r2.ok) return null;
            const buf = Buffer.from(await r2.arrayBuffer());
            return `data:${r2.headers.get('content-type') || 'image/png'};base64,${buf.toString('base64')}`;
          }
          return null;
        }
        const body = await res.text().catch(() => '');
        const retryable = isRetryable(res.status, body);
        if (retryable && attempt < retries) {
          this.logger.warn(
            `GapGPT preview ${res.status} transient, retry ${attempt + 1}/${retries}`,
          );
          await sleep(800 * (attempt + 1) + Math.random() * 400);
          continue;
        }
        if (retryable)
          this.logger.warn(
            `GapGPT preview ${res.status} failed after retries ${body.slice(0, 400)}`,
          );
        else
          this.logger.warn(
            `GapGPT preview ${res.status} ${body.slice(0, 400)}`,
          );
        return null;
      } catch (e: any) {
        const msg =
          e?.name === 'AbortError' ? 'timeout' : (e?.message ?? String(e));
        const retryable =
          msg.includes('timeout') ||
          msg.includes('fetch failed') ||
          e?.name === 'AbortError';
        if (retryable && attempt < retries) {
          this.logger.warn(
            `GapGPT preview ${msg} retry ${attempt + 1}/${retries}`,
          );
          await sleep(800 * (attempt + 1));
          continue;
        }
        this.logger.warn(`GapGPT preview failed: ${msg}`);
        return null;
      }
    }
    return null;
  }
  async recommendServices(
    input: ServiceRecommendInput,
  ): Promise<ServiceRecommendation[]> {
    const base = String(
      process.env.AI_API_URL || 'https://api.gapgpt.app/v1',
    ).replace(/\/$/, '');
    const apiKey = process.env.AI_API_KEY || '';
    const timeoutMs = Number(
      process.env.AI_SERVICE_RECOMMEND_TIMEOUT_MS || 12000,
    );
    if (!apiKey || !input.services.length)
      return this.fallback.recommendServices(input);
    try {
      const svcList = input.services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: s.price,
        duration: s.duration,
      }));
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are a barber service recommender. Given a selected hairstyle and available services (JSON), pick 1-3 most relevant serviceIds and explain briefly why each fits. Return JSON {recommendations:[{serviceId, reason, reasonFa, confidence}]}. Persian reasonFa required. No markdown.',
            },
            {
              role: 'user',
              content: JSON.stringify({
                hairstyle: input.hairstyle,
                profile: input.profile,
                services: svcList,
              }),
            },
          ],
          max_tokens: 600,
          temperature: 0.3,
        }),
      });
      clearTimeout(t);
      if (!res.ok) return this.fallback.recommendServices(input);
      const j: any = await res.json();
      const content: string = j?.choices?.[0]?.message?.content ?? '';
      const p = extractJson(content);
      const arr: any[] = p?.recommendations ?? p?.services ?? [];
      if (!arr.length) return this.fallback.recommendServices(input);
      const validIds = new Set(input.services.map((s) => s.id));
      const out: ServiceRecommendation[] = arr
        .filter((x) => validIds.has(String(x.serviceId)))
        .slice(0, 3)
        .map((x: any, i: number) => ({
          serviceId: String(x.serviceId),
          reason: String(x.reason ?? ''),
          reasonFa: String(x.reasonFa ?? x.reason ?? ''),
          confidence:
            typeof x.confidence === 'number' ? x.confidence : 0.85 - i * 0.07,
        }));
      return out.length ? out : this.fallback.recommendServices(input);
    } catch {
      return this.fallback.recommendServices(input);
    }
  }

  async smartReminder(input: SmartReminderInput): Promise<SmartReminderResult> {
    if (!process.env.AI_API_KEY) return this.fallback.smartReminder!(input);
    const base = String(process.env.AI_API_URL || 'https://api.gapgpt.app/v1').replace(/\/$/, '');
    const apiKey = process.env.AI_API_KEY;
    const timeoutMs = Number(process.env.AI_SMART_REMINDER_TIMEOUT_MS || 12000);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are a barber reminder assistant. Given customer history JSON (visits, frequency, favorite services, last visit, avg interval), predict next appointment date (YYYY-MM-DD), days from now, frequency label in Persian, confidence 0-1, and a short personalized Persian reminder message (messageFa) plus message English and insightsFa array. Also suggest 1-3 services from the provided list relevant to next visit. Return JSON {predictedDate,predictedDaysFromNow,frequencyLabelFa,confidence,message,messageFa,insightsFa[],suggestedServices:[{serviceId,title,titleFa,reasonFa,confidence}]}. Persian required for Fa fields. No markdown. If no history, predict ~14 days from today.' },
            { role: 'user', content: JSON.stringify({ ...input, today: tehranYMD(new Date()) }) },
          ],
          max_tokens: 900, temperature: 0.3,
        }),
      });
      clearTimeout(t);
      if (!res.ok) return this.fallback.smartReminder!(input);
      const j: any = await res.json();
      const p = extractJson(j?.choices?.[0]?.message?.content ?? '');
      if (!p?.messageFa) return this.fallback.smartReminder!(input);
      const validIds = new Set(input.services.map((s) => s.id));
      const sug = Array.isArray(p.suggestedServices) ? p.suggestedServices.filter((r: any) => !r.serviceId || validIds.has(String(r.serviceId))).slice(0, 3).map((r: any, i: number) => ({ serviceId: r.serviceId ? String(r.serviceId) : undefined, title: String(r.title ?? ''), titleFa: String(r.titleFa ?? r.title ?? ''), reasonFa: String(r.reasonFa ?? ''), confidence: typeof r.confidence === 'number' ? r.confidence : 0.82 - i * 0.07 })) : [];
      return { predictedDate: p.predictedDate ? String(p.predictedDate).slice(0, 10) : null, predictedDaysFromNow: typeof p.predictedDaysFromNow === 'number' ? p.predictedDaysFromNow : null, frequencyLabelFa: String(p.frequencyLabelFa ?? ''), confidence: typeof p.confidence === 'number' ? p.confidence : 0.78, message: String(p.message ?? ''), messageFa: String(p.messageFa ?? ''), insightsFa: Array.isArray(p.insightsFa) ? p.insightsFa.map(String) : [], suggestedServices: sug, meta: { provider: this.name, model: this.model } };
    } catch { return this.fallback.smartReminder!(input); }
  }

  async customerProfile(input: CustomerProfileInput): Promise<CustomerProfileResult> {
    if (!process.env.AI_API_KEY) return this.fallback.customerProfile!(input);
    const base = String(process.env.AI_API_URL || 'https://api.gapgpt.app/v1').replace(/\/$/, '');
    const apiKey = process.env.AI_API_KEY;
    const timeoutMs = Number(process.env.AI_CUSTOMER_PROFILE_TIMEOUT_MS || 12000);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are a barber assistant. Given customer history JSON, return JSON {summary,summaryFa,personaFa,insights[],insightsFa[],preferencesFa,recommendations:[{title,titleFa,reason,reasonFa,serviceId,confidence}]}. Persian required for Fa fields. Be concise (2-3 sentences summary). No markdown.' },
            { role: 'user', content: JSON.stringify(input) },
          ],
          max_tokens: 900, temperature: 0.3,
        }),
      });
      clearTimeout(t);
      if (!res.ok) return this.fallback.customerProfile!(input);
      const j: any = await res.json();
      const p = extractJson(j?.choices?.[0]?.message?.content ?? '');
      if (!p?.summaryFa) return this.fallback.customerProfile!(input);
      const validIds = new Set(input.services.map((s) => s.id));
      const recs = Array.isArray(p.recommendations) ? p.recommendations.filter((r: any) => !r.serviceId || validIds.has(String(r.serviceId))).slice(0, 4).map((r: any, i: number) => ({ title: String(r.title ?? ''), titleFa: String(r.titleFa ?? r.title ?? ''), reason: String(r.reason ?? ''), reasonFa: String(r.reasonFa ?? r.reason ?? ''), serviceId: r.serviceId ? String(r.serviceId) : undefined, confidence: typeof r.confidence === 'number' ? r.confidence : 0.82 - i * 0.07, tags: Array.isArray(r.tags) ? r.tags.map(String) : [] })) : [];
      return { summary: String(p.summary ?? ''), summaryFa: String(p.summaryFa ?? ''), personaFa: String(p.personaFa ?? ''), insights: Array.isArray(p.insights) ? p.insights.map(String) : [], insightsFa: Array.isArray(p.insightsFa) ? p.insightsFa.map(String) : [], preferencesFa: String(p.preferencesFa ?? ''), recommendations: recs.length ? recs : (await this.fallback.customerProfile!(input)).recommendations, meta: { provider: this.name, model: this.model } };
    } catch { return this.fallback.customerProfile!(input); }
  }

  async businessInsights(input: BusinessInsightsInput): Promise<BusinessInsightsResult> {
    if (!process.env.AI_API_KEY) return this.fallback.businessInsights!(input);
    const base = String(process.env.AI_API_URL || 'https://api.gapgpt.app/v1').replace(/\/$/, '');
    const apiKey = process.env.AI_API_KEY;
    const timeoutMs = Number(process.env.AI_BUSINESS_INSIGHTS_TIMEOUT_MS || 15000);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are a barbershop business analyst. Given aggregated JSON (totals, revenue, top services/barbers, customer counts, rates, daily breakdown, WoW trends, period) return JSON {summary,summaryFa,insights[],insightsFa[],trends:[{label,labelFa,direction:up|down|stable,changePercent:number|null,period,detailFa}],anomalies:[{title,titleFa,detail,detailFa,severity:low|medium|high,metric}],recommendations:[{title,titleFa,reason,reasonFa,priority:low|medium|high,actionFa,expectedImpactFa}]}. Persian required for all Fa fields. 2-3 sentence summaryFa, 3-5 insightsFa, 1-3 trends, 0-3 anomalies, 2-4 recommendations. No markdown. Never include customer PII; only aggregates.' },
            { role: 'user', content: JSON.stringify(input) },
          ],
          max_tokens: 1400, temperature: 0.3,
        }),
      });
      clearTimeout(t);
      if (!res.ok) return this.fallback.businessInsights!(input);
      const j: any = await res.json();
      const p = extractJson(j?.choices?.[0]?.message?.content ?? '');
      if (!p?.summaryFa || !Array.isArray(p.insightsFa)) return this.fallback.businessInsights!(input);
      const trends = Array.isArray(p.trends) ? p.trends.slice(0, 4).map((x: any) => ({ label: String(x.label ?? ''), labelFa: String(x.labelFa ?? x.label ?? ''), direction: ['up', 'down', 'stable'].includes(String(x.direction)) ? x.direction : 'stable' as const, changePercent: typeof x.changePercent === 'number' ? x.changePercent : null, period: String(x.period ?? ''), detailFa: x.detailFa ? String(x.detailFa) : undefined })) : [];
      const anomalies = Array.isArray(p.anomalies) ? p.anomalies.slice(0, 4).map((x: any) => ({ title: String(x.title ?? ''), titleFa: String(x.titleFa ?? x.title ?? ''), detail: String(x.detail ?? ''), detailFa: String(x.detailFa ?? x.detail ?? ''), severity: ['low', 'medium', 'high'].includes(String(x.severity)) ? x.severity : 'medium' as const, metric: x.metric ? String(x.metric) : undefined })) : [];
      const recommendations = Array.isArray(p.recommendations) ? p.recommendations.slice(0, 5).map((x: any) => ({ title: String(x.title ?? ''), titleFa: String(x.titleFa ?? x.title ?? ''), reason: String(x.reason ?? ''), reasonFa: String(x.reasonFa ?? x.reason ?? ''), priority: ['low', 'medium', 'high'].includes(String(x.priority)) ? x.priority : 'medium' as const, actionFa: String(x.actionFa ?? ''), expectedImpactFa: x.expectedImpactFa ? String(x.expectedImpactFa) : undefined })) : [];
      return { summary: String(p.summary ?? ''), summaryFa: String(p.summaryFa ?? ''), insights: Array.isArray(p.insights) ? p.insights.map(String) : [], insightsFa: p.insightsFa.map(String), trends, anomalies, recommendations: recommendations.length ? recommendations : (await this.fallback.businessInsights!(input)).recommendations, meta: { provider: this.name, model: this.model } };
    } catch { return this.fallback.businessInsights!(input); }
  }

  async recommend(buffer: Buffer, mime: string): Promise<AiAnalysisResult> {
    const base = String(
      process.env.AI_API_URL || 'https://api.gapgpt.app/v1',
    ).replace(/\/$/, '');
    const apiKey = process.env.AI_API_KEY || '';
    if (!apiKey) return this.fallback.recommend(buffer, mime);
    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 15000);
    try {
      const b64 = buffer.toString('base64');
      const dataUrl = `data:${mime};base64,${b64}`;
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: ctrl.signal,
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
      });
      clearTimeout(t);
      if (!res.ok) {
        this.logger.warn(
          `GapGPT ${res.status} ${(await res.text().catch(() => '')).slice(0, 300)}`,
        );
        return this.fallback.recommend(buffer, mime);
      }
      const j: any = await res.json();
      const content: string = j?.choices?.[0]?.message?.content ?? '';
      const p = extractJson(content);
      if (!p?.recommendations?.length)
        return this.fallback.recommend(buffer, mime);
      return normalize(p, this.name, this.model);
    } catch (e: any) {
      this.logger.warn(`GapGPT failed: ${e?.message ?? e}`);
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
      faceShape,
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
