import { Injectable } from '@nestjs/common';

export type ChatRole = 'customer' | 'barber' | 'admin';
export interface ChatLink {
  label: string;
  url: string;
}
export interface ChatAnswer {
  answer: string;
  intent: string;
  links: ChatLink[];
  suggestions: string[];
}

interface Rule {
  intent: string;
  match: RegExp;
  roles?: ChatRole[];
  answer: string;
  links: ChatLink[];
  suggestions: string[];
}

const L = {
  booking: '/tabs/booking',
  bookingNew: '/tabs/appointment/new',
  appointments: '/tabs/appointment',
  services: '/tabs/services',
  barbers: '/barbers',
  wallet: '/tabs/wallet',
  ai: '/tabs/ai-advisor',
  smart: '/tabs/smart-booking',
  training: '/tabs/training',
  docs: '/tabs/documents',
  profile: '/tabs/profile',
};

const RULES: Rule[] = [
  {
    intent: 'greeting',
    match: /^(سلام|درود|هی|hello|hi|سلاام)/i,
    answer:
      'سلام! من راهنمای نیوباربرم. بپرس: رزرو نوبت، قیمت خدمات، کیف پول، مشاور هوشمند.',
    links: [
      { label: 'رزرو نوبت', url: L.booking },
      { label: 'خدمات', url: L.services },
    ],
    suggestions: ['چطور نوبت رزرو کنم؟', 'قیمت خدمات چقدره؟', 'کیف پول چطور کار می‌کنه؟'],
  },
  {
    intent: 'booking_how',
    match: /(رزرو|نوبت.*(بگیر|گرفتن|ثبت)|book)/i,
    roles: ['customer'],
    answer:
      'برای رزرو: آرایشگر و خدمت را انتخاب کن، روز و ساعت آزاد را بزن، «تأیید و رزرو نهایی» را بزن. نوبت‌هایت در «نوبت‌ها» دیده می‌شود.',
    links: [
      { label: 'رزرو نوبت', url: L.booking },
      { label: 'رزرو هوشمند', url: L.smart },
      { label: 'نوبت‌های من', url: L.appointments },
    ],
    suggestions: ['چطور نوبتم را لغو کنم؟', 'زمان‌های آزاد کجاست؟', 'قیمت خدمات چقدره؟'],
  },
  {
    intent: 'booking_cancel',
    match: /(لغو|کنسل|cancel)/i,
    answer:
      'برای لغو: به «نوبت‌ها» برو، نوبت موردنظر را باز کن و «لغو» را بزن. نوبت لغوشده از لیست آینده حذف می‌شود.',
    links: [{ label: 'نوبت‌های من', url: L.appointments }],
    suggestions: ['چطور نوبت رزرو کنم؟', 'زمان‌های آزاد کجاست؟'],
  },
  {
    intent: 'booking_slots',
    match: /(ساعت.*آزاد|زمان.*آزاد|کی خالی|ظرفیت|slot)/i,
    answer:
      'زمان‌های آزاد بعد از انتخاب آرایشگر و تاریخ نمایش داده می‌شود. اگر روزی خالی نبود، «رزرو هوشمند» نزدیک‌ترین زمان‌ها را پیشنهاد می‌دهد.',
    links: [
      { label: 'رزرو نوبت', url: L.booking },
      { label: 'رزرو هوشمند', url: L.smart },
    ],
    suggestions: ['چطور نوبت رزرو کنم؟', 'بهترین آرایشگر کیه؟'],
  },
  {
    intent: 'services_price',
    match: /(قیمت|هزینه|تعرفه|قيمت|خدمات|price|سرویس)/i,
    answer:
      'قیمت و مدت هر خدمت در صفحه «خدمات» نوشته شده. در رزرو هم قبل از تأیید نهایی، مبلغ و مدت نمایش داده می‌شود.',
    links: [
      { label: 'خدمات', url: L.services },
      { label: 'رزرو نوبت', url: L.booking },
    ],
    suggestions: ['بهترین آرایشگر کیه؟', 'مشاور هوشمند چیه؟'],
  },
  {
    intent: 'barber_find',
    match: /(آرایشگر|بهترین|استاد|barber)/i,
    answer:
      'در «آرایشگران» می‌توانی جستجو کنی، پروفایل و خدمات هر آرایشگر را ببینی و مستقیم رزرو کنی.',
    links: [
      { label: 'آرایشگران', url: L.barbers },
      { label: 'رزرو نوبت', url: L.booking },
    ],
    suggestions: ['چطور نوبت رزرو کنم؟', 'قیمت خدمات چقدره؟'],
  },
  {
    intent: 'wallet',
    match: /(کیف پول|کیف‌پول|شارژ|پرداخت|موجودی|تراکنش|wallet|برداشت)/i,
    answer:
      'کیف پول در تب «کیف پول» است: شارژ، پرداخت رزرو با کیف پول، و مشاهده تراکنش‌ها. هنگام رزرو تیک «پرداخت با کیف پول» را بزن. حداقل شارژ ۱٬۰۰۰ تومان است.',
    links: [{ label: 'کیف پول', url: L.wallet }],
    suggestions: ['چطور نوبت رزرو کنم؟', 'چطور نوبتم را لغو کنم؟'],
  },
  {
    intent: 'ai_advisor',
    match: /(مشاور|استایل|مدل مو|موی|عکس|چهره|ai|هوشمند.*مو)/i,
    answer:
      '«مشاور هوشمند» با یک عکس چهره، فرم صورت را تشخیص می‌دهد و ۴ مدل مناسب با دلیل و نکته استایل پیشنهاد می‌کند. عکس فقط برای تحلیل ارسال می‌شود.',
    links: [
      { label: 'مشاور هوشمند', url: L.ai },
      { label: 'خدمات', url: L.services },
    ],
    suggestions: ['قیمت خدمات چقدره؟', 'چطور نوبت رزرو کنم؟'],
  },
  {
    intent: 'account',
    match: /(ثبت نام|ثبت‌نام|ورود|حساب|رمز|پروفایل|login|register|password)/i,
    answer:
      'از «پروفایل» می‌توانی اطلاعاتت را ویرایش کنی و رمز را عوض کنی. اگر رمز را فراموش کردی از صفحه ورود «فراموشی رمز» را بزن.',
    links: [{ label: 'پروفایل', url: L.profile }],
    suggestions: ['چطور نوبت رزرو کنم؟', 'سلام'],
  },
  {
    intent: 'barber_schedule',
    match: /(برنامه کاری|ساعات کاری|روز کاری|مرخصی|تعطیل|schedule|working)/i,
    roles: ['barber', 'admin'],
    answer:
      'آرایشگر: در صفحه «رزرو/برنامه» دکمه «مدیریت برنامه کاری» را بزن، روزهای فعال و ساعت شروع/پایان و استراحت را تنظیم و «ذخیره برنامه» را بزن.',
    links: [{ label: 'برنامه کاری', url: L.booking }],
    suggestions: ['نوبت‌ها را چطور تایید کنم؟', 'خدماتم را چطور ثبت کنم؟'],
  },
  {
    intent: 'barber_confirm',
    match: /(تایید|تائید|پذیرش|رد نوبت|confirm|accept)/i,
    roles: ['barber', 'admin'],
    answer:
      'نوبت‌های «در انتظار» در صفحه «نوبت‌ها» با دکمه «تایید» و «لغو» مدیریت می‌شوند. نوبت تاییدشده را بعد از انجام «انجام شد» بزن.',
    links: [{ label: 'نوبت‌ها', url: L.booking }],
    suggestions: ['برنامه کاریم را چطور تنظیم کنم؟', 'آموزش‌ها کجاست؟'],
  },
  {
    intent: 'barber_services',
    match: /(خدمت.*(من|ثبت|ایجاد|ویرایش)|سرویس.*(من|جدید))/i,
    roles: ['barber', 'admin'],
    answer:
      'خدمات در صفحه «خدمات» با «افزودن خدمت» ثبت می‌شود: نام، قیمت و مدت (دقیقه). ویرایش و حذف هم از همان‌جا انجام می‌شود.',
    links: [{ label: 'خدمات', url: L.services }],
    suggestions: ['برنامه کاریم را چطور تنظیم کنم؟', 'مدرکم را چطور ثبت کنم؟'],
  },
  {
    intent: 'barber_docs',
    match: /(مدرک|گواهی|گواهینامه|آموزش|ویدیو|certificate|training|document)/i,
    roles: ['barber', 'admin'],
    answer:
      'مدارک در «مدارک» ثبت می‌شود و آموزش‌های ویدیویی در «آموزش». برای موقعیت مکانی آرایشگاه از صفحه جزئیات آرایشگر بخش «مدیریت» استفاده کن.',
    links: [
      { label: 'مدارک', url: L.docs },
      { label: 'آموزش', url: L.training },
    ],
    suggestions: ['برنامه کاریم را چطور تنظیم کنم؟', 'نوبت‌ها را چطور تایید کنم؟'],
  },
];

const FALLBACK: ChatAnswer = {
  answer:
    'متوجه نشدم. می‌توانی این‌ها را بپرسی: رزرو نوبت، لغو نوبت، قیمت خدمات، کیف پول، مشاور هوشمند. نقش تو مشتری است یا آرایشگر؟',
  intent: 'fallback',
  links: [
    { label: 'رزرو نوبت', url: L.booking },
    { label: 'خدمات', url: L.services },
    { label: 'کیف پول', url: L.wallet },
  ],
  suggestions: ['چطور نوبت رزرو کنم؟', 'قیمت خدمات چقدره؟', 'مشاور هوشمند چیه؟'],
};

const BARBER_FALLBACK: ChatAnswer = {
  answer:
    'متوجه نشدم. به‌عنوان آرایشگر بپرس: برنامه کاری، تایید نوبت، ثبت خدمت، مدارک و آموزش.',
  intent: 'fallback',
  links: [
    { label: 'نوبت‌ها', url: L.booking },
    { label: 'خدمات', url: L.services },
    { label: 'آموزش', url: L.training },
  ],
  suggestions: ['برنامه کاریم را چطور تنظیم کنم؟', 'نوبت‌ها را چطور تایید کنم؟', 'خدماتم را چطور ثبت کنم؟'],
};

@Injectable()
export class ChatbotService {
  ask(message: string, role: ChatRole = 'customer'): ChatAnswer {
    const text = String(message ?? '').trim().slice(0, 500);
    if (!text) return this.fallback(role);
    const scored = RULES.map((r) => ({ r, hit: r.match.test(text) })).filter((x) => x.hit);
    if (!scored.length) return this.fallback(role);
    const roleFirst = scored.find((x) => !x.r.roles || x.r.roles.includes(role));
    const best = roleFirst ?? scored[0];
    return {
      answer: best.r.answer,
      intent: best.r.intent,
      links: best.r.links,
      suggestions: best.r.suggestions,
    };
  }

  faqs(role: ChatRole = 'customer'): string[] {
    if (role === 'barber' || role === 'admin')
      return [
        'برنامه کاریم را چطور تنظیم کنم؟',
        'نوبت‌ها را چطور تایید کنم؟',
        'خدماتم را چطور ثبت کنم؟',
        'مدرکم را چطور ثبت کنم؟',
      ];
    return [
      'چطور نوبت رزرو کنم؟',
      'چطور نوبتم را لغو کنم؟',
      'قیمت خدمات چقدره؟',
      'کیف پول چطور کار می‌کنه؟',
      'مشاور هوشمند چیه؟',
    ];
  }

  private fallback(role: ChatRole): ChatAnswer {
    return role === 'customer' ? FALLBACK : BARBER_FALLBACK;
  }
}
