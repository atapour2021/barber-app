import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../services/entities/service.entity';
import { Barber } from '../barbers/entities/barber.entity';
export type ChatRole = 'user' | 'customer' | 'barber' | 'admin' | 'super_admin';
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Service) private svcRepo: Repository<Service>,
    @InjectRepository(Barber) private barberRepo: Repository<Barber>,
  ) {}
  async reply(message: string, role: ChatRole, history: Array<{ role: string; text: string }> = []) {
    const q = (message || '').trim().slice(0, 1000).toLowerCase();
    if (!q) return this.fallback(role);
    if (/(سلام|درود|hello|hi|hey|صبح بخیر|عصر بخیر)/.test(q)) return this.greeting(role);
    if (/(رزرو|نوبت|وقت|booking|reserve|appointment.*(create|book))/.test(q)) return this.booking(role);
    if (/(لغو|cancel)/.test(q)) return this.cancel(role);
    if (/(وضعیت|پیگیری|status|turns|نوبت.*من)/.test(q)) return this.status(role);
    if (/(قیمت|هزینه|price|تعرفه)/.test(q)) return this.services(role, q);
    if (/(خدمات|service|اصلاح|کوتاه|استایل)/.test(q)) return this.services(role, q);
    if (/(آرایشگر|barber|استاد)/.test(q)) return this.barbers(role);
    if (/(زمان آزاد|slot|available|ساعات کاری|working|برنامه)/.test(q)) return this.availability(role);
    if (/(آدرس|location|کجا|نقشه|map)/.test(q)) return this.location(role);
    if (/(کیف پول|wallet|شارژ|موجودی|پرداخت)/.test(q)) return this.wallet(role);
    if (/(مشاور|استایل|ai|هوش مصنوعی|hairstyle)/.test(q)) return this.ai(role);
    if (/(پروفایل|profile|حساب)/.test(q)) return this.profile(role);
    if (/(راهنما|کمک|help|چطور|چگونه)/.test(q)) return this.help(role);
    if (history.length && /بله|همه|بیشتر|more/.test(q)) return this.services(role, q);
    return this.fallback(role);
  }
  private greeting(role: ChatRole) {
    const isBarber = role === 'barber';
    return {
      intent: 'greeting',
      reply: isBarber ? 'سلام استاد 👋 پنل آرایشگر در اختیار شماست. برای مدیریت برنامه کاری، نوبت‌های امروز یا خدمات بگویید چه کمکی کنم؟' : 'سلام 👋 من دستیار نیوباربر هستم. رزرو نوبت، معرفی خدمات و آرایشگران، پیگیری نوبت و راهنمای اپلیکیشن — بفرمایید چه کمکی کنم؟',
      suggestions: isBarber ? ['نوبت‌های امروز', 'مدیریت برنامه کاری', 'افزودن خدمت'] : ['رزرو نوبت', 'خدمات و قیمت', 'معرفی آرایشگران'],
      quickReplies: isBarber ? ['برنامه کاری', 'نوبت‌ها', 'خدمات'] : ['رزرو', 'خدمات', 'آرایشگران', 'پیگیری نوبت'],
    };
  }
  private booking(role: ChatRole) {
    const isBarber = role === 'barber';
    return {
      intent: 'booking',
      reply: isBarber ? 'مدیریت نوبت‌ها از تب «نوبت‌ها» و «برنامه». برای تغییر وضعیت (تایید/انجام/لغو) وارد جزئیات هر نوبت شوید.' : 'برای رزرو: ۱) آرایشگر و خدمت را انتخاب کنید ۲) تاریخ را بزنید ۳) از «بررسی زمان‌های آزاد» ساعت را انتخاب و «تأیید و رزرو» کنید. مسیر: خانه → رزرو نوبت جدید یا تب «رزرو».',
      suggestions: ['بررسی زمان‌های آزاد', 'پیگیری نوبت‌ها', 'خدمات و قیمت'],
      quickReplies: ['خدمات', 'آرایشگران', 'نوبت‌های من'],
    };
  }
  private cancel(_role: ChatRole) {
    return {
      intent: 'cancel',
      reply: 'لغو: وارد «نوبت‌ها» شوید، نوبت مورد نظر → لغو. فقط نوبت‌های در انتظار/تایید شده قابل لغو هستند.',
      suggestions: ['پیگیری نوبت‌ها', 'رزرو مجدد'],
      quickReplies: ['نوبت‌ها', 'رزرو'],
    };
  }
  private status(_role: ChatRole) {
    return {
      intent: 'status',
      reply: 'وضعیت نوبت‌هایتان در تب «نوبت‌ها» (فیلتر: در انتظار/تایید/انجام/لغو). جزئیات هر نوبت را هم می‌توانید باز کنید.',
      suggestions: ['لغو نوبت', 'رزرو جدید'],
      quickReplies: ['نوبت‌ها', 'رزرو'],
    };
  }
  private async services(role: ChatRole, q: string) {
    try {
      const all = await this.svcRepo.find({ order: { createdAt: 'DESC' } as any, take: 6 });
      if (all.length) {
        const list = all.slice(0, 4).map((s) => `• ${s.name} — ${Number(s.price).toLocaleString('fa-IR')} تومان (${s.duration} دقیقه)`).join('\n');
        return {
          intent: 'services',
          reply: `خدمات پرطرفدار:\n${list}\n\nبرای جزئیات و رزرو از تب «خدمات» خدمت را انتخاب کنید.`,
          suggestions: ['رزرو نوبت', 'معرفی آرایشگران'],
          quickReplies: ['رزرو', 'آرایشگران', 'قیمت'],
          data: { services: all.slice(0, 6) },
        };
      }
    } catch {}
    return {
      intent: 'services',
      reply: 'خدمات شامل کوتاهی، اصلاح ریش، استایل و پکیج داماد است. قیمت و زمان هر خدمت در تب «خدمات» نمایش داده می‌شود.',
      suggestions: ['رزرو نوبت', 'معرفی آرایشگران'],
      quickReplies: ['خدمات', 'رزرو'],
    };
  }
  private async barbers(_role: ChatRole) {
    try {
      const all = await this.barberRepo.find({ take: 4, order: { createdAt: 'DESC' } as any });
      if (all.length) {
        const list = all.map((b) => `• ${b.fullName}${b.isAvailable ? ' (در دسترس)' : ''}`).join('\n');
        return {
          intent: 'barbers',
          reply: `آرایشگران فعال:\n${list}\n\nبرای مشاهده پروفایل و رزرو، تب «آرایشگران» یا صفحه هر آرایشگر را باز کنید.`,
          suggestions: ['رزرو نوبت', 'خدمات'],
          quickReplies: ['آرایشگران', 'رزرو', 'خدمات'],
          data: { barbers: all },
        };
      }
    } catch {}
    return {
      intent: 'barbers',
      reply: 'آرایشگران برتر را در تب «آرایشگران» ببینید. هر پروفایل شامل خدمات، زمان‌های آزاد و امتیاز است.',
      suggestions: ['رزرو نوبت', 'خدمات'],
      quickReplies: ['آرایشگران', 'رزرو'],
    };
  }
  private availability(role: ChatRole) {
    const isBarber = role === 'barber';
    return {
      intent: 'availability',
      reply: isBarber ? 'برنامه کاری‌تان را از تب «برنامه» ویرایش کنید: روزهای کاری، ساعات هر روز و زمان استراحت. تعطیلات را هم می‌توانید ثبت کنید.' : 'زمان‌های آزاد هر آرایشگر بر اساس روزهای کاری، ساعات و استراحت محاسبه می‌شود. در صفحه رزرو تاریخ را انتخاب و «بررسی زمان‌های آزاد» بزنید.',
      suggestions: isBarber ? ['نوبت‌های امروز', 'افزودن خدمت'] : ['رزرو نوبت', 'معرفی آرایشگران'],
      quickReplies: ['برنامه', 'نوبت‌ها', 'رزرو'],
    };
  }
  private location(_role: ChatRole) {
    return {
      intent: 'location',
      reply: 'موقعیت آرایشگاه: تب «موقعیت آرایشگاه» (سعادت‌آباد) + مسیریابی و آدرس‌های شما در تب «آدرس‌ها».',
      suggestions: ['مسیریابی', 'آدرس‌های من'],
      quickReplies: ['آدرس‌ها', 'موقعیت'],
    };
  }
  private wallet(_role: ChatRole) {
    return {
      intent: 'wallet',
      reply: 'کیف پول: تب «کیف پول» — شارژ، پرداخت رزرو با کیف پول، تاریخچه تراکنش‌ها. حداقل شارژ ۱٬۰۰۰ تومان.',
      suggestions: ['شارژ کیف پول', 'تراکنش‌ها'],
      quickReplies: ['کیف پول', 'شارژ'],
    };
  }
  private ai(_role: ChatRole) {
    return {
      intent: 'ai',
      reply: 'مشاور هوشمند استایل: عکس چهره بدهید، فرم صورت و ۴ استایل پیشنهادی + خدمات مرتبط را می‌گیرید. مسیر: منو → مشاور هوشمند یا خانه → مشاور هوشمند.',
      suggestions: ['رفتن به مشاور', 'خدمات'],
      quickReplies: ['مشاور', 'خدمات'],
    };
  }
  private profile(_role: ChatRole) {
    return {
      intent: 'profile',
      reply: 'پروفایل: تب «پروفایل» — ویرایش اطلاعات، تغییر رمز، آدرس‌ها، تم روشن/تیره و خروج.',
      suggestions: ['ویرایش پروفایل', 'تغییر رمز'],
      quickReplies: ['پروفایل', 'آدرس‌ها'],
    };
  }
  private help(role: ChatRole) {
    const isBarber = role === 'barber';
    return {
      intent: 'help',
      reply: isBarber ? 'راهنمای آرایشگر: نوبت‌ها (تایید/انجام/لغو)، برنامه (روز/ساعت/استراحت/تعطیلی)، خدمات (افزودن/ویرایش)، آموزش و مدارک در تب‌های مربوطه.' : 'راهنما: رزرو (تب رزرو)، پیگیری (تب نوبت‌ها)، خدمات (تب خدمات)، آرایشگران (تب آرایشگران)، کیف پول و مشاور هوشمند از منو.',
      suggestions: isBarber ? ['نوبت‌های امروز', 'مدیریت برنامه'] : ['رزرو نوبت', 'پیگیری نوبت'],
      quickReplies: isBarber ? ['برنامه', 'نوبت‌ها'] : ['رزرو', 'خدمات', 'پروفایل'],
    };
  }
  private fallback(role: ChatRole) {
    const isBarber = role === 'barber';
    return {
      intent: 'fallback',
      reply: isBarber ? 'متوجه نشدم — بفرمایید: مدیریت نوبت‌ها، برنامه کاری یا خدمات؟' : 'متوجه نشدم — منظورتان رزرو، قیمت خدمات، معرفی آرایشگران یا پیگیری نوبت است؟',
      suggestions: isBarber ? ['نوبت‌های امروز', 'برنامه کاری', 'خدمات'] : ['رزرو نوبت', 'خدمات و قیمت', 'آرایشگران', 'پیگیری نوبت'],
      quickReplies: isBarber ? ['نوبت‌ها', 'برنامه', 'خدمات'] : ['رزرو', 'خدمات', 'آرایشگران'],
    };
  }
}
