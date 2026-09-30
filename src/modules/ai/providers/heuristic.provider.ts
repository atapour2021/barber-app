import { Injectable } from '@nestjs/common';
import {
  AiAnalysisResult,
  AiProvider,
  FaceShape,
  HairRecommendation,
} from './ai-provider.interface';

const FACE_SHAPES: FaceShape[] = [
  'oval',
  'round',
  'square',
  'heart',
  'oblong',
  'diamond',
];

const POOL: Array<
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

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
