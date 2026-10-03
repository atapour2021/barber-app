import { Injectable } from '@nestjs/common';
import {
  AiAnalysisResult,
  AiProvider,
  BusinessInsightsInput,
  BusinessInsightsResult,
  CustomerProfileInput,
  CustomerProfileResult,
  CustomerRecommendation,
  FaceShape,
  HairRecommendation,
  ServiceRecommendInput,
  ServiceRecommendation,
  SmartReminderInput,
  SmartReminderResult,
} from './ai-provider.interface';

const FACE_SHAPES: FaceShape[] = [
  'oval',
  'round',
  'square',
  'heart',
  'oblong',
  'diamond',
];

export const POOL: Array<
  Omit<HairRecommendation, 'confidence' | 'reason' | 'reasonFa'>
> = [
  {
    id: 'fade-classic',
    title: 'Classic Fade',
    titleFa: 'فید کلاسیک',
    category: 'fade',
    length: 'short',
    description:
      'Clean tapered fade with textured top, low maintenance and sharp outline.',
    descriptionFa: 'فید تمیز و تدرّجی با بافت روی سر، نگهداری آسان و خطوط تیز.',
    stylingTips: ['Use matte wax', 'Trim every 2-3 weeks', 'Blow dry forward'],
    stylingTipsFa: [
      'از واکس مات استفاده کنید',
      'هر ۲-۳ هفته اصلاح کنید',
      'با سشوار به جلو حالت دهید',
    ],
    suitableFaceShapes: ['oval', 'square', 'round'],
    maintenance: 'medium',
    tags: ['fade', 'short', 'clean'],
  },
  {
    id: 'french-crop',
    title: 'French Crop',
    titleFa: 'فرنچ کروپ',
    category: 'crop',
    length: 'short',
    description:
      'Short fringe with textured top, great for balancing round faces.',
    descriptionFa: 'فرِنچ کوتاه با بافت، عالی برای متعادل کردن صورت گرد.',
    stylingTips: ['Texturizing powder', 'Forward fringe'],
    stylingTipsFa: ['پودر بافت‌دهنده', 'چتری به جلو'],
    suitableFaceShapes: ['round', 'oval', 'heart'],
    maintenance: 'low',
    tags: ['crop', 'fringe', 'short'],
  },
  {
    id: 'side-part',
    title: 'Side Part',
    titleFa: 'فرق بغل کلاسیک',
    category: 'classic',
    length: 'medium',
    description: 'Timeless side part with volume, professional and versatile.',
    descriptionFa: 'فرق بغل کلاسیک با حجم، شیک و مناسب محیط حرفه‌ای.',
    stylingTips: ['Comb with side part', 'Light pomade'],
    stylingTipsFa: ['با شانه فرق بغل بزنید', 'پماد سبک'],
    suitableFaceShapes: ['oval', 'square', 'oblong'],
    maintenance: 'medium',
    tags: ['classic', 'part', 'medium'],
  },
  {
    id: 'pompadour',
    title: 'Pompadour',
    titleFa: 'پمپادور حجمی',
    category: 'volume',
    length: 'medium',
    description:
      'Voluminous top with tight sides, adds height for round faces.',
    descriptionFa: 'حجم بالا با کناره‌های کوتاه، قد چهره گرد را متعادل می‌کند.',
    stylingTips: ['Blow dry up', 'Strong hold pomade'],
    stylingTipsFa: ['سشوار به بالا', 'پماد قوی'],
    suitableFaceShapes: ['round', 'heart', 'oval'],
    maintenance: 'high',
    tags: ['volume', 'pompadour', 'medium'],
  },
  {
    id: 'curly-top',
    title: 'Curly Top',
    titleFa: 'فر طبیعی / تاپ حجیم',
    category: 'curly',
    length: 'medium',
    description:
      'Embrace natural texture with layered top for balanced silhouette.',
    descriptionFa: 'بافت طبیعی با لایه‌بندی برای تعادل چهره.',
    stylingTips: ['Curl cream', 'Diffuse dry'],
    stylingTipsFa: ['کرم فر', 'خشک کردن دیفیوزری'],
    suitableFaceShapes: ['square', 'oval', 'diamond'],
    maintenance: 'medium',
    tags: ['curly', 'texture', 'medium'],
  },
  {
    id: 'buzz-cut',
    title: 'Buzz Cut',
    titleFa: 'باز کات کوتاه',
    category: 'buzz',
    length: 'short',
    description: 'Ultra low maintenance, highlights bone structure.',
    descriptionFa: 'نگهداری بسیار آسان، تأکید بر استخوان‌بندی صورت.',
    stylingTips: ['Weekly trim', 'Moisturize scalp'],
    stylingTipsFa: ['اصلاح هفتگی', 'مرطوب‌کننده پوست سر'],
    suitableFaceShapes: ['oval', 'square', 'diamond'],
    maintenance: 'low',
    tags: ['buzz', 'short', 'minimal'],
  },
  {
    id: 'long-layered',
    title: 'Long Layered',
    titleFa: 'بلند لایه‌ای',
    category: 'layered',
    length: 'long',
    description: 'Layered length that softens angular features.',
    descriptionFa: 'لایه‌های بلند برای نرم کردن زوایای صورت.',
    stylingTips: ['Leave-in conditioner', 'Trim every 6 weeks'],
    stylingTipsFa: ['نرم‌کننده بعد حمام', 'کوتاهی هر ۶ هفته'],
    suitableFaceShapes: ['square', 'heart', 'oblong'],
    maintenance: 'medium',
    tags: ['long', 'layered'],
  },
  {
    id: 'quiff',
    title: 'Quiff',
    titleFa: 'کوییف مدرن',
    category: 'quiff',
    length: 'medium',
    description: 'Modern quiff with taper, stylish and adaptable.',
    descriptionFa: 'کوییف مدرن با فید کناره‌ها، شیک و منعطف.',
    stylingTips: ['Pre-style with spray', 'Finish with clay'],
    stylingTipsFa: ['اسپری پیش‌حالت', 'تثبیت با کلی'],
    suitableFaceShapes: ['oval', 'round', 'heart'],
    maintenance: 'high',
    tags: ['quiff', 'taper', 'medium'],
  },
];

function hashPick(buffer: Buffer): number {
  let h = 2166136261;
  for (let i = 0; i < Math.min(buffer.length, 4096); i++) {
    h ^= buffer[i];
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

@Injectable()
export class HeuristicProvider implements AiProvider {
  readonly name = 'heuristic';
  readonly model = 'heuristic-v1';

  async preview(
    _buffer: Buffer,
    _mime: string,
    rec: HairRecommendation,
  ): Promise<string | null> {
    const label = (rec.titleFa || rec.title || rec.id).slice(0, 28);
    const cat = (rec.category || '').slice(0, 16);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0b101e"/><stop offset="100%" stop-color="#1a2338"/></linearGradient></defs><rect width="600" height="800" rx="20" fill="url(#g)"/><rect x="24" y="24" width="552" height="552" rx="16" fill="#0f172a" stroke="#f59e0b" stroke-opacity="0.25"/><text x="300" y="310" text-anchor="middle" font-family="Vazirmatn,sans-serif" font-size="22" font-weight="800" fill="#f59e0b">${esc(label)}</text><text x="300" y="340" text-anchor="middle" font-family="Vazirmatn,sans-serif" font-size="13" fill="#94a3b8">${esc(cat)}</text><text x="300" y="620" text-anchor="middle" font-family="Vazirmatn,sans-serif" font-size="11" fill="#64748b">پیش‌نمایش هوش مصنوعی — ${esc(label)}</text><text x="300" y="640" text-anchor="middle" font-family="Vazirmatn,sans-serif" font-size="10" fill="#475569">heuristic preview · ${esc(rec.id)}</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  async recommendServices(
    input: ServiceRecommendInput,
  ): Promise<ServiceRecommendation[]> {
    const rec = input.hairstyle;
    if (!input.services.length) return [];
    const scored = input.services.map((s) => ({
      s,
      score: serviceScore(s, {
        category: rec.category,
        title: rec.title,
        titleFa: rec.titleFa,
        tags: rec.tags ?? [],
        length: rec.length,
      }),
    }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 3);
    const min = top[0]?.score ?? 0;
    const chosen =
      min > 0
        ? top.filter((x) => x.score > 0)
        : scored.slice(0, Math.min(3, scored.length));
    const list = (
      chosen.length ? chosen : scored.slice(0, Math.min(2, scored.length))
    ).map((x) => x.s);
    const r = buildReason(rec);
    return list.map((s, i) => ({
      serviceId: s.id,
      reason: r.reason,
      reasonFa: r.reasonFa,
      confidence: Math.round((0.88 - i * 0.08) * 100) / 100,
    }));
  }

  async recommend(buffer: Buffer, _mime?: string): Promise<AiAnalysisResult> {
    const h = hashPick(buffer);
    const faceShape = FACE_SHAPES[h % FACE_SHAPES.length];
    const faceShapeConfidence = 0.72 + (h % 18) / 100;
    const scored = POOL.map((r, idx) => ({
      r,
      score:
        (r.suitableFaceShapes.includes(faceShape) ? 10 : 0) +
        ((h + idx * 7) % 10),
    }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ r }, order) => ({
        ...r,
        confidence: Math.round((0.82 - order * 0.07) * 100) / 100,
        reason: `Suitable for ${faceShape} face: balances proportions and highlights features.`,
        reasonFa: `مناسب چهره ${faceShapeFa(faceShape)}: تعادل تناسب و تأکید بر ویژگی‌ها.`,
      }));
    return {
      analysis: {
        faceShape,
        faceShapeConfidence: Math.round(faceShapeConfidence * 100) / 100,
        hairCharacteristics: {
          texture: h % 2 === 0 ? 'straight' : 'wavy',
          length: h % 3 === 0 ? 'short' : h % 3 === 1 ? 'medium' : 'long',
          density: h % 2 === 0 ? 'medium' : 'thick',
        },
        detectedFeatures: ['face', 'hair', 'jawline'],
        confidence: Math.round(faceShapeConfidence * 100) / 100,
      },
      recommendations: scored,
      meta: { provider: this.name, model: this.model },
    };
  }

  async customerProfile(input: CustomerProfileInput): Promise<CustomerProfileResult> {
    return customerProfileHeuristic(input);
  }

  async smartReminder(input: SmartReminderInput): Promise<SmartReminderResult> {
    return smartReminderHeuristic(input);
  }

  async businessInsights(input: BusinessInsightsInput): Promise<BusinessInsightsResult> {
    return businessInsightsHeuristic(input);
  }
}

function faceShapeFa(s: FaceShape): string {
  const m: Record<string, string> = {
    oval: 'بیضی',
    round: 'گرد',
    square: 'مربعی',
    heart: 'قلبی',
    oblong: 'کشیده',
    diamond: 'لوزی',
    unknown: 'نامشخص',
  };
  return m[s] ?? s;
}

const STYLING_EXTRAS: Record<string, string[]> = {
  fade: ['فید و تمیزکاری خط ریش', 'اصلاح کناره‌ها', 'شستشو و حالت‌دهی'],
  crop: ['کروپ و مرتب‌سازی فرق', 'اصلاح دور گوش', 'واکس مات'],
  classic: ['فرق بغل و سشوار', 'اصلاح کلاسیک', 'حالت‌دهی حرفه‌ای'],
  volume: ['پمپادور و حجم‌دهی', 'فید کناره‌ها', 'سشوار حجمی'],
  curly: ['لایه‌بندی فر', 'مرتب‌سازی فر', 'محصولات مراقبت فر'],
  buzz: ['باز کات دقیق', 'تمیزکاری خطوط', 'مراقبت پوست سر'],
  layered: ['لایه‌بندی بلند', 'اصلاح نوک مو', 'نرم‌کننده'],
  quiff: ['کوییف و فید', 'حالت‌دهی با کلی', 'اسپری تثبیت'],
  general: ['کوتاهی و استایل', 'اصلاح و فرم‌دهی', 'مشاوره استایل'],
};

function serviceScore(
  svc: { name: string; description?: string | null; icon?: string | null },
  rec: {
    category: string;
    title: string;
    titleFa: string;
    tags: string[];
    length: string;
  },
): number {
  const hay =
    `${svc.name} ${svc.description ?? ''} ${svc.icon ?? ''}`.toLowerCase();
  const keys = new Set<string>();
  [rec.category, rec.title, rec.titleFa, ...rec.tags].forEach((t) =>
    String(t || '')
      .toLowerCase()
      .split(/[\s,_\-]+/)
      .forEach((w) => w && keys.add(w)),
  );
  keys.add(rec.length);
  let score = 0;
  for (const k of keys) if (k.length >= 2 && hay.includes(k)) score += 2;
  const cat = rec.category.toLowerCase();
  if (
    cat === 'fade' &&
    (hay.includes('فید') || hay.includes('fade') || hay.includes('کوتاه'))
  )
    score += 2;
  if (cat === 'curly' && (hay.includes('فر') || hay.includes('curly')))
    score += 2;
  if (cat === 'buzz' && (hay.includes('باز') || hay.includes('buzz')))
    score += 2;
  if (
    rec.length === 'short' &&
    (hay.includes('کوتاه') || hay.includes('short'))
  )
    score += 1;
  if (rec.length === 'long' && (hay.includes('بلند') || hay.includes('long')))
    score += 1;
  return score;
}

function buildReason(rec: {
  titleFa: string;
  title: string;
  category: string;
}): { reason: string; reasonFa: string } {
  const name = rec.titleFa || rec.title;
  const extras = STYLING_EXTRAS[rec.category] ?? STYLING_EXTRAS.general;
  return {
    reason: `Matches ${name} (${rec.category}) — keeps the cut clean and face-balanced.`,
    reasonFa: `متناسب با استایل «${name}» — اجرای تمیز کوتاهی و حفظ تعادل چهره. خدمات پیشنهادی: ${extras.slice(0, 2).join('، ')}.`,
  };
}

async function customerProfileHeuristic(input: CustomerProfileInput): Promise<CustomerProfileResult> {
  const { customer, stats, recentAppointments, services } = input;
  const fullName = `${customer.name} ${customer.family}`.trim();
  const total = stats.totalAppointments;
  let personaFa = 'مشتری جدید';
  if (total === 0) personaFa = 'مشتری جدید — بدون مراجعه ثبت‌شده';
  else if (total >= 10) personaFa = 'مشتری وفادار';
  else if (total >= 4) personaFa = 'مشتری منظم';
  else personaFa = 'مشتری در حال آشنایی';
  if (total > 0 && stats.lastVisitAt) {
    const daysSince = Math.floor((Date.now() - new Date(stats.lastVisitAt).getTime()) / 86400000);
    if (daysSince > 45) personaFa += ' · در معرض ریزش';
    else if (daysSince > 30) personaFa += ' · نیاز به یادآوری';
  }
  if (stats.noShow > 0 || stats.cancelled >= 2) personaFa += ' · الگوی لغو';
  const favSvc = stats.favoriteServiceNames.slice(0, 2).join('، ') || 'نامشخص';
  const barberFav = stats.favoriteBarberName || '—';
  const dayFa: Record<string, string> = { monday: 'دوشنبه', tuesday: 'سه‌شنبه', wednesday: 'چهارشنبه', thursday: 'پنجشنبه', friday: 'جمعه', saturday: 'شنبه', sunday: 'یکشنبه' };
  const prefDayFa = stats.preferredDayOfWeek ? dayFa[stats.preferredDayOfWeek] ?? stats.preferredDayOfWeek : 'نامشخص';
  const avgFa = stats.avgDaysBetween ? `هر ${Math.round(stats.avgDaysBetween)} روز` : '—';
  const lastFa = stats.lastVisitAt ? new Date(stats.lastVisitAt).toISOString().slice(0, 10) : '—';
  const summary = `${fullName} has ${total} appointments (${stats.completed} completed). Favorite: ${favSvc}. Avg interval: ${avgFa}. Preferred day: ${prefDayFa}.`;
  const summaryFa = `${fullName} با ${total} نوبت (${stats.completed} تکمیل‌شده)، محبوب‌ترین خدمت: ${favSvc}، میانگین فاصله مراجعه ${avgFa}، روز ترجیحی ${prefDayFa}، آخرین مراجعه ${lastFa} است.`;
  const insights: string[] = [];
  const insightsFa: string[] = [];
  if (total === 0) {
    insights.push('No history yet — opportunity to create first impression');
    insightsFa.push('بدون سابقه مراجعه — فرصت برای ایجاد اولین تجربه عالی');
  } else {
    if (stats.completed / Math.max(1, total) >= 0.7) { insights.push('High completion rate — reliable customer'); insightsFa.push('نرخ تکمیل بالا — مشتری قابل اعتماد'); }
    if (stats.cancelled >= 2) { insights.push(`Frequent cancellations (${stats.cancelled}) — confirm before slot`); insightsFa.push(`لغو مکرر (${stats.cancelled} بار) — قبل از رزرو تایید بگیرید`); }
    if (stats.noShow > 0) { insights.push(`No-show ${stats.noShow}x — send reminder`); insightsFa.push(`${stats.noShow} بار عدم حضور — یادآوری ارسال کنید`); }
    if (stats.avgDaysBetween && stats.avgDaysBetween <= 14) { insights.push('Short interval — suggest maintenance package'); insightsFa.push('فاصله کوتاه مراجعه — پکیج نگهداری پیشنهاد دهید'); }
    if (stats.avgDaysBetween && stats.avgDaysBetween >= 35) { insights.push('Long interval — re-engagement offer recommended'); insightsFa.push('فاصله طولانی — پیشنهاد بازگشت بدهید'); }
    if (recentAppointments.length) {
      const lastSvc = recentAppointments[0].serviceName;
      insights.push(`Last service: ${lastSvc}`);
      insightsFa.push(`آخرین خدمت: ${lastSvc}`);
    }
    if (stats.preferredDayOfWeek) { insights.push(`Prefers ${stats.preferredDayOfWeek}s`); insightsFa.push(`ترجیح روز: ${prefDayFa}`); }
  }
  if (!insights.length) { insights.push('Regular customer — keep consistent service'); insightsFa.push('مشتری منظم — کیفیت را ثابت نگه دارید'); }
  const preferencesFa = `خدمت محبوب: ${favSvc} · آرایشگر محبوب: ${barberFav} · روز ترجیحی: ${prefDayFa} · فاصله میانگین: ${avgFa}`;
  const scored = services.map((s) => {
    let score = 0;
    const hay = `${s.name} ${s.description ?? ''}`.toLowerCase();
    for (const fav of stats.favoriteServiceNames) if (fav && hay.includes(fav.toLowerCase().slice(0, 4))) score += 5;
    if (recentAppointments[0]?.serviceName && hay.includes(recentAppointments[0].serviceName.toLowerCase().slice(0, 4))) score += 2;
    return { s, score };
  }).sort((a, b) => b.score - a.score);
  const top = (scored[0]?.score ? scored.filter((x) => x.score > 0).slice(0, 3) : scored.slice(0, 3)).map((x) => x.s).slice(0, 3);
  const finalRecs: CustomerRecommendation[] = top.length ? top.map((s, i) => ({
    title: s.name,
    titleFa: s.name,
    reason: `Based on favorite ${favSvc} and recent ${recentAppointments[0]?.serviceName ?? 'history'}`,
    reasonFa: `بر اساس علاقه به «${favSvc}» و آخرین خدمت «${recentAppointments[0]?.serviceName ?? 'تاریخچه'}» — مناسب برای حفظ رضایت و تکرار مراجعه.`,
    serviceId: s.id,
    confidence: Math.round((0.88 - i * 0.08) * 100) / 100,
    tags: ['history-based'],
  })) : [];
  if (!finalRecs.length && services.length) {
    const fallback = services.slice(0, 2).map((s, i) => ({
      title: s.name, titleFa: s.name, reason: 'Popular service', reasonFa: 'خدمت پرطرفدار — پیشنهاد اولیه مناسب', serviceId: s.id, confidence: 0.75 - i * 0.07, tags: ['general'],
    }));
    finalRecs.push(...fallback);
  }
  if (stats.lastVisitAt) {
    const daysSince = Math.floor((Date.now() - new Date(stats.lastVisitAt).getTime()) / 86400000);
    if (daysSince > 30 && finalRecs.length < 3) finalRecs.push({ title: 'Re-engagement', titleFa: 'پیشنهاد بازگشت', reason: `Last visit ${daysSince} days ago`, reasonFa: `آخرین مراجعه ${daysSince} روز پیش — پیام یادآوری با تخفیف بازگشت ارسال کنید`, confidence: 0.72, tags: ['retention'] });
  }
  return { summary, summaryFa, personaFa, insights, insightsFa, preferencesFa, recommendations: finalRecs.slice(0, 4), meta: { provider: 'heuristic', model: 'heuristic-v1' } };
}

async function smartReminderHeuristic(input: SmartReminderInput): Promise<SmartReminderResult> {
  const { customer, stats, recentAppointments, services } = input;
  const fullName = `${customer.name} ${customer.family}`.trim() || customer.username;
  const firstName = customer.name || fullName.split(' ')[0] || 'دوست';
  const total = stats.totalAppointments;
  const avg = stats.avgDaysBetween;
  const favSvc = stats.favoriteServiceNames.slice(0, 2).join('، ') || 'خدمت محبوب شما';
  const favBarber = stats.favoriteBarberName || '';
  const dayFa: Record<string, string> = { monday: 'دوشنبه', tuesday: 'سه‌شنبه', wednesday: 'چهارشنبه', thursday: 'پنجشنبه', friday: 'جمعه', saturday: 'شنبه', sunday: 'یکشنبه' };
  const prefDayFa = stats.preferredDayOfWeek ? dayFa[stats.preferredDayOfWeek] ?? stats.preferredDayOfWeek : '';
  const daysSince = stats.daysSinceLastVisit ?? (stats.lastVisitAt ? Math.floor((Date.now() - new Date(stats.lastVisitAt).getTime()) / 86400000) : null);
  let avgForPredict = avg;
  if (avgForPredict == null) {
    if (total === 0) avgForPredict = 14;
    else if (total >= 6) avgForPredict = 21;
    else if (total >= 3) avgForPredict = 24;
    else avgForPredict = 28;
  }
  avgForPredict = Math.max(7, Math.min(90, Math.round(avgForPredict)));
  let predictedDate: string | null = null;
  let predictedDaysFromNow: number | null = null;
  const now = new Date();
  if (stats.lastVisitAt) {
    const last = new Date(stats.lastVisitAt);
    const predicted = new Date(last.getTime() + avgForPredict * 86400000);
    const diffFromNow = Math.round((predicted.getTime() - now.getTime()) / 86400000);
    if (diffFromNow <= 0) {
      const tomorrow = new Date(now.getTime() + 86400000);
      predictedDate = tomorrow.toISOString().slice(0, 10);
      predictedDaysFromNow = 1;
    } else {
      predictedDate = predicted.toISOString().slice(0, 10);
      predictedDaysFromNow = diffFromNow;
    }
  } else {
    const soon = new Date(now.getTime() + 7 * 86400000);
    predictedDate = soon.toISOString().slice(0, 10);
    predictedDaysFromNow = 7;
  }
  let frequencyLabelFa = 'منظم';
  if (avgForPredict <= 14) frequencyLabelFa = 'هفتگی · پرتکرار';
  else if (avgForPredict <= 21) frequencyLabelFa = 'هر ۲ تا ۳ هفته';
  else if (avgForPredict <= 35) frequencyLabelFa = 'ماهانه';
  else frequencyLabelFa = 'با فاصله · نامنظم';
  let confidence = 0.55;
  if (total >= 5 && avg != null) confidence = 0.88;
  else if (total >= 3 && avg != null) confidence = 0.78;
  else if (total >= 1) confidence = 0.65;
  if (daysSince != null && daysSince > 60) confidence = Math.max(0.6, confidence - 0.05);
  confidence = Math.round(confidence * 100) / 100;
  const lastDateFa = stats.lastVisitAt ? new Date(stats.lastVisitAt).toISOString().slice(0, 10) : '—';
  const overdue = daysSince != null && avgForPredict != null && daysSince > avgForPredict;
  let messageFa = '';
  let message = '';
  if (total === 0) {
    messageFa = `سلام ${firstName} عزیز! هنوز دیداری ثبت نشده — بهترین زمان برای اولین تجربه، همین هفته است (${predictedDate}). خدمت «${favSvc}» را امتحان کن و استایل دلخواهت را بساز.`;
    message = `Hi ${firstName}! No visits yet — the best time for your first experience is this week (${predictedDate}). Try "${favSvc}".`;
  } else if (overdue) {
    const overBy = daysSince! - avgForPredict;
    messageFa = `سلام ${firstName} عزیز! حدود ${daysSince} روز از آخرین مراجعه‌ات (${lastDateFa}، ${favSvc}${favBarber ? ` با ${favBarber}` : ''}) گذشته — حدود ${overBy} روز از زمان معمولت (${avgForPredict} روز) عقب افتاده‌ای. پیشنهاد می‌کنیم همین فردا (${predictedDate}) نوبت بگیری${prefDayFa ? ` — معمولا ${prefDayFa}ها می‌آیی` : ''}.`;
    message = `Hi ${firstName}! It's been ${daysSince} days since your last visit (${lastDateFa}). You're ${overBy} days overdue (usual ${avgForPredict}d). Book tomorrow (${predictedDate}).`;
  } else {
    const remain = predictedDaysFromNow ?? Math.max(1, avgForPredict - (daysSince ?? 0));
    messageFa = `سلام ${firstName} عزیز! آخرین مراجعه‌ات ${lastDateFa} (${favSvc}) بود — با میانگین هر ${avgForPredict} روز، نوبت بعدی‌ات حدود ${predictedDate} (حدود ${remain} روز دیگر) مناسب است${prefDayFa ? `، معمولا ${prefDayFa}ها` : ''}${favBarber ? ` با ${favBarber}` : ''}. یادت نره رزرو کنی!`;
    message = `Hi ${firstName}! Last visit ${lastDateFa} (${favSvc}). With avg ${avgForPredict}d, next visit around ${predictedDate} (${remain}d from now).`;
  }
  const insightsFa: string[] = [];
  if (total === 0) insightsFa.push('مشتری جدید — پیام خوش‌آمد و پیشنهاد اولین خدمت');
  else {
    if (avgForPredict <= 14) insightsFa.push(`مراجعه پرتکرار هر ${avgForPredict} روز — پکیج نگهداری پیشنهاد دهید`);
    if (avgForPredict >= 35) insightsFa.push(`فاصله طولانی (${avgForPredict} روز) — پیشنهاد بازگشت با تخفیف`);
    if (overdue) insightsFa.push(`تاخیر ${daysSince! - avgForPredict} روزه — یادآوری فوری لازم است`);
    if (stats.cancelled >= 2) insightsFa.push(`لغو مکرر (${stats.cancelled} بار) — قبل از رزرو تایید بگیرید`);
    if (stats.noShow > 0) insightsFa.push(`${stats.noShow} بار عدم حضور — یادآوری پیامکی بفرستید`);
    if (prefDayFa) insightsFa.push(`روز ترجیحی: ${prefDayFa}`);
    if (favBarber) insightsFa.push(`آرایشگر محبوب: ${favBarber}`);
    if (recentAppointments[0]?.serviceName) insightsFa.push(`آخرین خدمت: ${recentAppointments[0].serviceName}`);
  }
  if (!insightsFa.length) insightsFa.push('مشتری منظم — یادآوری ملایم کافی است');
  const scored = services.map((s) => {
    let score = 0;
    const hay = `${s.name} ${s.description ?? ''}`.toLowerCase();
    for (const fav of stats.favoriteServiceNames) if (fav && hay.includes(fav.toLowerCase().slice(0, 4))) score += 5;
    if (recentAppointments[0]?.serviceName && hay.includes(recentAppointments[0].serviceName.toLowerCase().slice(0, 4))) score += 3;
    return { s, score };
  }).sort((a, b) => b.score - a.score);
  const top = (scored[0]?.score ? scored.filter((x) => x.score > 0).slice(0, 3) : scored.slice(0, 3)).map((x) => x.s).slice(0, 3);
  const suggestedServices = top.map((s, i) => ({
    serviceId: s.id,
    title: s.name,
    titleFa: s.name,
    reasonFa: `بر اساس علاقه به «${favSvc}» و آخرین خدمت «${recentAppointments[0]?.serviceName ?? 'تاریخچه'}» — مناسب برای نوبت بعدی در ${predictedDate ?? 'هفته آینده'}.`,
    confidence: Math.round((0.88 - i * 0.08) * 100) / 100,
  }));
  if (!suggestedServices.length && services.length) {
    suggestedServices.push(...services.slice(0, 2).map((s, i) => ({ serviceId: s.id, title: s.name, titleFa: s.name, reasonFa: 'خدمت پرطرفدار — پیشنهاد مناسب برای نوبت بعدی', confidence: 0.72 - i * 0.06 })));
  }
  return { predictedDate, predictedDaysFromNow, frequencyLabelFa, confidence, message, messageFa, insightsFa, suggestedServices: suggestedServices.slice(0, 3), meta: { provider: 'heuristic', model: 'heuristic-v1' } };
}

async function businessInsightsHeuristic(input: BusinessInsightsInput): Promise<BusinessInsightsResult> {
  const t = input.totals;
  const rev = input.revenue;
  const rates = input.rates;
  const cust = input.customers;
  const topSvcs = input.topServices.slice(0, 3);
  const topBarbers = input.topBarbers.slice(0, 3);
  const sumFa = `در ${input.period.days} روز اخیر، ${t.totalAppointments} نوبت (${t.completed} تکمیل، ${t.cancelled} لغو، ${t.noShow} عدم حضور) با درآمد ${Math.round(rev.total).toLocaleString('fa-IR')} تومان ثبت شد. میانگین هر نوبت تکمیل‌شده ${Math.round(rev.avgPerCompleted).toLocaleString('fa-IR')} تومان، نرخ تکمیل ${(rates.completionRate * 100).toFixed(1)}٪ و لغو ${(rates.cancellationRate * 100).toFixed(1)}٪ است.`;
  const insights: string[] = [];
  const insightsFa: string[] = [];
  if (t.totalAppointments === 0) {
    insights.push('No appointments in period');
    insightsFa.push('در این بازه نوبتی ثبت نشده — داده برای تحلیل کافی نیست');
  } else {
    if (rates.completionRate >= 0.7) { insights.push('High completion'); insightsFa.push('نرخ تکمیل بالا — عملکرد قابل اعتماد'); }
    if (rates.cancellationRate >= 0.2) { insights.push(`High cancellation ${(rates.cancellationRate * 100).toFixed(1)}%`); insightsFa.push(`نرخ لغو بالا ${(rates.cancellationRate * 100).toFixed(1)}٪ — سیاست تایید/پیش‌پرداخت را بررسی کنید`); }
    if (rates.noShowRate >= 0.08) { insights.push(`No-show ${((rates.noShowRate) * 100).toFixed(1)}%`); insightsFa.push(`عدم حضور ${(rates.noShowRate * 100).toFixed(1)}٪ — یادآوری پیامکی/تماسی را تقویت کنید`); }
    if (cust.repeatRate != null && cust.repeatRate < 0.25) { insights.push('Low repeat rate'); insightsFa.push('تکرار مراجعه پایین — بسته وفاداری/یادآور پیشنهاد دهید'); }
    if (topSvcs[0]) { insights.push(`Top service: ${topSvcs[0].name} x${topSvcs[0].count}`); insightsFa.push(`محبوب‌ترین خدمت: «${topSvcs[0].name}» با ${topSvcs[0].count} نوبت — ظرفیت این خدمت را تقویت کنید`); }
    if (topBarbers[0] && t.totalAppointments > 6) {
      const leader = topBarbers[0];
      const share = ((leader.count / Math.max(1, t.totalAppointments)) * 100).toFixed(0);
      if (Number(share) >= 55) { insights.push(`${leader.name} handles ${share}%`); insightsFa.push(`«${leader.name}» سهم ${share}٪ نوبت‌ها را دارد — توزیع نوبت‌ها را متعادل کنید`); }
    }
    if (input.trends.weekOverWeekCountChange != null) {
      const ch = input.trends.weekOverWeekCountChange;
      if (ch <= -0.2) insightsFa.push(`افت ${Math.abs(Math.round(ch * 100))}٪ تعداد نوبت نسبت به هفته قبل — کمپین بازگشت را فعال کنید`);
      else if (ch >= 0.2) insightsFa.push(`رشد ${Math.round(ch * 100)}٪ تعداد نوبت نسبت به هفته قبل — ظرفیت را حفظ کنید`);
    }
  }
  if (!insightsFa.length) insightsFa.push('عملکرد پایدار — روندها را هفتگی پایش کنید');
  if (!insights.length) insights.push('Stable — monitor weekly');

  const trends: BusinessInsightsResult['trends'] = [];
  const cCh = input.trends.weekOverWeekCountChange;
  if (cCh != null) {
    const dir: 'up' | 'down' | 'stable' = Math.abs(cCh) < 0.05 ? 'stable' : cCh > 0 ? 'up' : 'down';
    trends.push({ label: 'Appointments WoW', labelFa: 'تغییر هفتگی نوبت‌ها', direction: dir, changePercent: Math.round(cCh * 1000) / 10, period: '7d vs prev 7d', detailFa: dir === 'stable' ? 'بدون تغییر محسوس' : dir === 'up' ? `رشد ${Math.round(cCh * 100)}٪` : `افت ${Math.abs(Math.round(cCh * 100))}٪` });
  }
  const rCh = input.trends.weekOverWeekRevenueChange;
  if (rCh != null) {
    const dir: 'up' | 'down' | 'stable' = Math.abs(rCh) < 0.05 ? 'stable' : rCh > 0 ? 'up' : 'down';
    trends.push({ label: 'Revenue WoW', labelFa: 'تغییر هفتگی درآمد', direction: dir, changePercent: Math.round(rCh * 1000) / 10, period: '7d vs prev 7d', detailFa: dir === 'stable' ? 'درآمد پایدار' : dir === 'up' ? `رشد ${Math.round(rCh * 100)}٪` : `افت ${Math.abs(Math.round(rCh * 100))}٪` });
  }
  if (input.dailyBreakdown.length >= 7) {
    const last = input.dailyBreakdown.slice(-7);
    const avg = last.reduce((s, x) => s + x.count, 0) / 7;
    const lastDay = last[last.length - 1];
    if (avg > 0 && lastDay.count >= avg * 1.6) trends.push({ label: 'Spike', labelFa: 'جهش روزانه', direction: 'up', changePercent: Math.round(((lastDay.count / avg) - 1) * 1000) / 10, period: lastDay.date, detailFa: `${lastDay.date}: ${lastDay.count} نوبت vs میانگین ${avg.toFixed(1)}` });
  }

  const anomalies: BusinessInsightsResult['anomalies'] = [];
  if (rates.cancellationRate >= 0.25) anomalies.push({ title: 'High cancellation', titleFa: 'نرخ لغو بالا', detail: `${(rates.cancellationRate * 100).toFixed(1)}% cancelled`, detailFa: `لغو ${(rates.cancellationRate * 100).toFixed(1)}٪ کل نوبت‌ها — بالاتر از آستانه ۲۵٪`, severity: rates.cancellationRate >= 0.4 ? 'high' : 'medium', metric: 'cancellationRate' });
  if (rates.noShowRate >= 0.1) anomalies.push({ title: 'Elevated no-show', titleFa: 'عدم حضور بالا', detail: `${(rates.noShowRate * 100).toFixed(1)}% no-show`, detailFa: `عدم حضور ${(rates.noShowRate * 100).toFixed(1)}٪ — یادآوری ۲۴ساعته را فعال کنید`, severity: rates.noShowRate >= 0.18 ? 'high' : 'medium', metric: 'noShowRate' });
  if (input.dailyBreakdown.length) {
    const vals = input.dailyBreakdown.map(d => d.count);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, vals.length));
    for (const d of input.dailyBreakdown) if (sd > 0 && (d.count - mean) / sd >= 2) { anomalies.push({ title: 'Daily spike', titleFa: 'جهش روزانه', detail: `${d.date}: ${d.count} vs avg ${mean.toFixed(1)}`, detailFa: `${d.date}: ${d.count} نوبت، میانگین ${mean.toFixed(1)} (انحراف ${(d.count - mean).toFixed(1)})`, severity: d.count >= mean + 2.5 * sd ? 'high' : 'medium', metric: d.date }); break; }
  }
  if (topBarbers.length >= 2) {
    const [a, b] = topBarbers;
    if (a.count >= (b.count * 2.5) && t.totalAppointments >= 10) anomalies.push({ title: 'Workload imbalance', titleFa: 'عدم توازن بار آرایشگرها', detail: `${a.name} ${a.count} vs ${b.name} ${b.count}`, detailFa: `«${a.name}» ${a.count} نوبت در برابر «${b.name}» ${b.count} — توزیع را بازنگری کنید`, severity: 'medium', metric: 'topBarbers' });
  }

  const recommendations: BusinessInsightsResult['recommendations'] = [];
  if (rates.cancellationRate >= 0.18) recommendations.push({ title: 'Confirm pending faster', titleFa: 'تایید سریع‌تر نوبت‌های در انتظار', reason: 'High cancellation wastes slots', reasonFa: `لغو بالا (${(rates.cancellationRate * 100).toFixed(1)}٪) ظرفیت را هدر می‌دهد`, priority: 'high', actionFa: 'تایید در ۲ ساعت + یادآوری ۲۴ساعته + سیاست لغو شفاف', expectedImpactFa: 'کاهش لغو تا ۳۰٪' });
  if (rates.noShowRate >= 0.08) recommendations.push({ title: 'Reduce no-show', titleFa: 'کاهش عدم حضور', reason: 'No-show loses revenue', reasonFa: `عدم حضور ${(rates.noShowRate * 100).toFixed(1)}٪ درآمد را کاهش می‌دهد`, priority: 'high', actionFa: 'پیامک/واتساپ ۲۴ساعته + تماس برای VIP + لیست انتظار', expectedImpactFa: 'کاهش no-show' });
  if (input.trends.weekOverWeekCountChange != null && input.trends.weekOverWeekCountChange <= -0.15) recommendations.push({ title: 'Re-engagement campaign', titleFa: 'کمپین بازگشت مشتری', reason: 'WoW drop', reasonFa: `افت ${Math.abs(Math.round((input.trends.weekOverWeekCountChange ?? 0) * 100))}٪ هفتگی`, priority: 'high', actionFa: 'پیام تخفیف بازگشت برای مشتریان ۳۰+ روز بدون مراجعه', expectedImpactFa: 'بازگشت ۱۰-۱۵٪' });
  if (cust.repeatRate != null && cust.repeatRate < 0.3 && t.totalAppointments >= 8) recommendations.push({ title: 'Loyalty offer', titleFa: 'بسته وفاداری', reason: 'Low repeat', reasonFa: `تکرار ${(cust.repeatRate * 100).toFixed(0)}٪ پایین است`, priority: 'medium', actionFa: 'کارت ۵+۱ یا تخفیف ماهانه برای مشتریان تکراری', expectedImpactFa: 'افزایش تکرار' });
  if (topSvcs[0]) recommendations.push({ title: `Push ${topSvcs[0].name}`, titleFa: `تقویت «${topSvcs[0].name}»`, reason: 'Best seller', reasonFa: `«${topSvcs[0].name}» پرفروش‌ترین است`, priority: 'low', actionFa: `اسلات‌های ویژه و باندل با خدمت مکمل برای «${topSvcs[0].name}»`, expectedImpactFa: 'درآمد بیشتر هر نوبت' });
  if (!recommendations.length) recommendations.push({ title: 'Keep monitoring', titleFa: 'پایش مستمر', reason: 'Stable', reasonFa: 'عملکرد پایدار است', priority: 'low', actionFa: 'گزارش هفتگی + بررسی لغو/no-show', expectedImpactFa: 'حفظ روند' });

  return { summary: `Business in ${input.period.days}d: ${t.totalAppointments} appts, ${t.completed} completed, revenue ${rev.total}`, summaryFa: sumFa, insights, insightsFa, trends: trends.slice(0, 4), anomalies: anomalies.slice(0, 4), recommendations: recommendations.slice(0, 5), meta: { provider: 'heuristic', model: 'heuristic-v1' } };
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
