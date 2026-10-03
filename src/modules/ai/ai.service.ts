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
import { User } from '../users/entities/user.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Barber } from '../barbers/entities/barber.entity';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import type {
  AiAnalysisResult,
  AiProvider,
  BusinessInsightsInput,
  BusinessInsightsResult,
  CustomerProfileInput,
  CustomerProfileResult,
  HairRecommendation,
  ServiceRecommendInput,
  ServiceRecommendation,
  SmartReminderInput,
  SmartReminderResult,
} from './providers/ai-provider.interface';
import { HeuristicProvider } from './providers/heuristic.provider';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  constructor(
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
    @InjectRepository(Service) private readonly svcRepo: Repository<Service>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Appointment) private readonly apptRepo: Repository<Appointment>,
    @InjectRepository(Barber) private readonly barberRepo: Repository<Barber>,
  ) {}

  private buildSmartInput(user: any, appointments: any[], services: any[]): SmartReminderInput {
    const completed = appointments.filter((a) => String(a.status) === 'completed').length;
    const cancelled = appointments.filter((a) => String(a.status) === 'cancelled').length;
    const noShow = appointments.filter((a) => String(a.status) === 'no_show').length;
    const pending = appointments.filter((a) => String(a.status) === 'pending').length;
    const confirmed = appointments.filter((a) => String(a.status) === 'confirmed').length;
    const sortedByTime = [...appointments].sort((a, b) => new Date(a.startTime as any).getTime() - new Date(b.startTime as any).getTime());
    const firstVisitAt = sortedByTime[0] ? new Date(sortedByTime[0].startTime as any).toISOString() : null;
    const lastVisitAt = sortedByTime.length ? new Date(sortedByTime[sortedByTime.length - 1].startTime as any).toISOString() : null;
    let avgDaysBetween: number | null = null;
    if (sortedByTime.length >= 2) {
      let sum = 0;
      for (let i = 1; i < sortedByTime.length; i++) sum += (new Date(sortedByTime[i].startTime as any).getTime() - new Date(sortedByTime[i - 1].startTime as any).getTime()) / 86400000;
      avgDaysBetween = sum / (sortedByTime.length - 1);
    }
    const svcCount = new Map<string, { name: string; c: number }>();
    const barberCount = new Map<string, { name: string; c: number }>();
    const dayCount = new Map<string, number>();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (const a of appointments) {
      const sName = (a as any).service?.name ?? String((a as any).serviceId ?? '');
      if (sName) { const cur = svcCount.get(sName); svcCount.set(sName, { name: sName, c: (cur?.c ?? 0) + 1 }); }
      const bName = (a as any).barber?.fullName ?? String((a as any).barberId ?? '');
      if (bName) { const cur = barberCount.get(bName); barberCount.set(bName, { name: bName, c: (cur?.c ?? 0) + 1 }); }
      try { const d = new Date(a.startTime as any); const day = days[d.getUTCDay()]; dayCount.set(day, (dayCount.get(day) ?? 0) + 1); } catch {}
    }
    const favoriteServiceNames = [...svcCount.values()].sort((a, b) => b.c - a.c).slice(0, 3).map((x) => x.name);
    const favoriteBarberName = [...barberCount.values()].sort((a, b) => b.c - a.c)[0]?.name ?? null;
    let preferredDayOfWeek: string | null = null;
    let maxDay = 0;
    for (const [k, v] of dayCount) if (v > maxDay) { maxDay = v; preferredDayOfWeek = k; }
    const recentAppointments = appointments.slice(0, 5).map((a) => ({ date: new Date(a.startTime as any).toISOString().slice(0, 10), serviceName: (a as any).service?.name ?? '', barberName: (a as any).barber?.fullName ?? '', status: String(a.status) }));
    const daysSinceLastVisit = lastVisitAt ? Math.floor((Date.now() - new Date(lastVisitAt).getTime()) / 86400000) : null;
    return {
      customer: { id: user.id, name: (user as any).name, family: (user as any).family, username: (user as any).username, phoneNumber: (user as any).phoneNumber, createdAt: (user as any).createdAt ? new Date((user as any).createdAt).toISOString() : undefined },
      stats: { totalAppointments: appointments.length, completed, cancelled, noShow, pending, confirmed, lastVisitAt, firstVisitAt, avgDaysBetween, favoriteServiceNames, favoriteBarberName, preferredDayOfWeek, totalServices: svcCount.size, daysSinceLastVisit },
      recentAppointments,
      services: services.map((s) => ({ id: s.id, name: s.name, description: s.description, price: Number(s.price), duration: s.duration })),
    };
  }

  async customerProfile(customerId: string, actor?: any): Promise<CustomerProfileResult & { customer: { id: string; name: string; family: string; username: string }; stats: CustomerProfileInput['stats']; recentAppointments: CustomerProfileInput['recentAppointments'] }> {
    if (!customerId) throw new BadRequestException('customerId required');
    const user = await this.userRepo.findOne({ where: { id: customerId } });
    if (!user) throw new BadRequestException('Customer not found');
    const appointments = await this.apptRepo.find({ where: { userId: customerId } as any, relations: { service: true, barber: true } as any, order: { startTime: 'DESC' } as any, take: 100 });
    const services = await this.svcRepo.find({ order: { createdAt: 'DESC' } as any, take: 50 });
    const completed = appointments.filter((a) => String(a.status) === 'completed').length;
    const cancelled = appointments.filter((a) => String(a.status) === 'cancelled').length;
    const noShow = appointments.filter((a) => String(a.status) === 'no_show').length;
    const pending = appointments.filter((a) => String(a.status) === 'pending').length;
    const confirmed = appointments.filter((a) => String(a.status) === 'confirmed').length;
    const sortedByTime = [...appointments].sort((a, b) => new Date(a.startTime as any).getTime() - new Date(b.startTime as any).getTime());
    const firstVisitAt = sortedByTime[0] ? new Date(sortedByTime[0].startTime as any).toISOString() : null;
    const lastVisitAt = sortedByTime.length ? new Date(sortedByTime[sortedByTime.length - 1].startTime as any).toISOString() : null;
    let avgDaysBetween: number | null = null;
    if (sortedByTime.length >= 2) {
      let sum = 0;
      for (let i = 1; i < sortedByTime.length; i++) sum += (new Date(sortedByTime[i].startTime as any).getTime() - new Date(sortedByTime[i - 1].startTime as any).getTime()) / 86400000;
      avgDaysBetween = sum / (sortedByTime.length - 1);
    }
    const svcCount = new Map<string, { name: string; c: number }>();
    const barberCount = new Map<string, { name: string; c: number }>();
    const dayCount = new Map<string, number>();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (const a of appointments) {
      const sName = (a as any).service?.name ?? String((a as any).serviceId ?? '');
      if (sName) { const cur = svcCount.get(sName); svcCount.set(sName, { name: sName, c: (cur?.c ?? 0) + 1 }); }
      const bName = (a as any).barber?.fullName ?? String((a as any).barberId ?? '');
      if (bName) { const cur = barberCount.get(bName); barberCount.set(bName, { name: bName, c: (cur?.c ?? 0) + 1 }); }
      try { const d = new Date(a.startTime as any); const day = days[d.getUTCDay()]; dayCount.set(day, (dayCount.get(day) ?? 0) + 1); } catch {}
    }
    const favoriteServiceNames = [...svcCount.values()].sort((a, b) => b.c - a.c).slice(0, 3).map((x) => x.name);
    const favoriteBarberName = [...barberCount.values()].sort((a, b) => b.c - a.c)[0]?.name ?? null;
    let preferredDayOfWeek: string | null = null;
    let maxDay = 0;
    for (const [k, v] of dayCount) if (v > maxDay) { maxDay = v; preferredDayOfWeek = k; }
    const recentAppointments = appointments.slice(0, 5).map((a) => ({ date: new Date(a.startTime as any).toISOString().slice(0, 10), serviceName: (a as any).service?.name ?? '', barberName: (a as any).barber?.fullName ?? '', status: String(a.status) }));
    const input: CustomerProfileInput = {
      customer: { id: user.id, name: (user as any).name, family: (user as any).family, username: (user as any).username, phoneNumber: (user as any).phoneNumber, createdAt: (user as any).createdAt ? new Date((user as any).createdAt).toISOString() : undefined },
      stats: { totalAppointments: appointments.length, completed, cancelled, noShow, pending, confirmed, lastVisitAt, firstVisitAt, avgDaysBetween, favoriteServiceNames, favoriteBarberName, preferredDayOfWeek, totalServices: svcCount.size },
      recentAppointments,
      services: services.map((s) => ({ id: s.id, name: s.name, description: s.description, price: Number(s.price), duration: s.duration })),
    };
    const timeoutMs = Number(process.env.AI_CUSTOMER_PROFILE_TIMEOUT_MS || 12000);
    let result: CustomerProfileResult;
    const fn = (this.provider as AiProvider & { customerProfile?: unknown }).customerProfile;
    if (typeof fn === 'function') {
      try {
        result = await withTimeout((fn as any).call(this.provider, input) as Promise<CustomerProfileResult>, timeoutMs, 'AI customer profile timeout');
        if (!result?.summaryFa) throw new Error('empty');
      } catch (e: any) {
        if (e?.message !== 'AI customer profile timeout') this.logger.warn(`AI customerProfile failed: ${e?.message ?? e}`);
        const h = new HeuristicProvider();
        result = await h.customerProfile!(input);
      }
    } else {
      const h = new HeuristicProvider();
      result = await h.customerProfile!(input);
    }
    return { ...result, customer: { id: user.id, name: (user as any).name, family: (user as any).family, username: (user as any).username }, stats: input.stats, recentAppointments };
  }

  async smartReminderFor(customerId: string): Promise<SmartReminderResult & { customer: { id: string; name: string; family: string; username: string }; stats: SmartReminderInput['stats']; recentAppointments: SmartReminderInput['recentAppointments'] }> {
    if (!customerId) throw new BadRequestException('customerId required');
    const user = await this.userRepo.findOne({ where: { id: customerId } });
    if (!user) throw new BadRequestException('Customer not found');
    const appointments = await this.apptRepo.find({ where: { userId: customerId } as any, relations: { service: true, barber: true } as any, order: { startTime: 'DESC' } as any, take: 100 });
    const services = await this.svcRepo.find({ order: { createdAt: 'DESC' } as any, take: 50 });
    const input = this.buildSmartInput(user, appointments, services);
    const timeoutMs = Number(process.env.AI_SMART_REMINDER_TIMEOUT_MS || 12000);
    let result: SmartReminderResult;
    const fn = (this.provider as AiProvider & { smartReminder?: unknown }).smartReminder;
    if (typeof fn === 'function') {
      try {
        result = await withTimeout((fn as any).call(this.provider, input) as Promise<SmartReminderResult>, timeoutMs, 'AI smart reminder timeout');
        if (!result?.messageFa) throw new Error('empty');
      } catch (e: any) {
        if (e?.message !== 'AI smart reminder timeout') this.logger.warn(`AI smartReminder failed: ${e?.message ?? e}`);
        result = await new HeuristicProvider().smartReminder!(input);
      }
    } else {
      result = await new HeuristicProvider().smartReminder!(input);
    }
    return { ...result, customer: { id: user.id, name: (user as any).name, family: (user as any).family, username: (user as any).username }, stats: input.stats, recentAppointments: input.recentAppointments };
  }

  async businessInsights(query: { from?: string; to?: string; days?: number }): Promise<BusinessInsightsResult & { aggregates: { period: BusinessInsightsInput['period']; totals: BusinessInsightsInput['totals']; revenue: BusinessInsightsInput['revenue']; topServices: BusinessInsightsInput['topServices']; topBarbers: BusinessInsightsInput['topBarbers']; customers: BusinessInsightsInput['customers']; rates: BusinessInsightsInput['rates']; dailyBreakdown: BusinessInsightsInput['dailyBreakdown']; trends: BusinessInsightsInput['trends'] }; periodLabelFa: string }> {
    const daysIn = Number((query as any).days);
    const hasDays = Number.isFinite(daysIn) && daysIn >= 7 && daysIn <= 365;
    let toD: Date;
    if ((query as any).to) {
      const t = new Date(String((query as any).to).slice(0, 10) + 'T23:59:59.999Z');
      toD = isNaN(t.getTime()) ? new Date() : t;
    } else toD = new Date();
    toD.setUTCHours(23, 59, 59, 999);
    let fromD: Date;
    if ((query as any).from) {
      const f = new Date(String((query as any).from).slice(0, 10) + 'T00:00:00.000Z');
      fromD = isNaN(f.getTime()) ? new Date(toD.getTime() - 29 * 86400000) : f;
      fromD.setUTCHours(0, 0, 0, 0);
    } else {
      const d = hasDays ? daysIn : 30;
      fromD = new Date(toD.getTime() - (d - 1) * 86400000);
      fromD.setUTCHours(0, 0, 0, 0);
    }
    if (fromD.getTime() > toD.getTime()) { const tmp = fromD; fromD = toD; toD = tmp as Date; fromD.setUTCHours(0, 0, 0, 0); toD.setUTCHours(23, 59, 59, 999); }
    const maxSpan = 365 * 86400000;
    if (toD.getTime() - fromD.getTime() > maxSpan) { fromD = new Date(toD.getTime() - 364 * 86400000); fromD.setUTCHours(0, 0, 0, 0); }
    const days = Math.max(1, Math.round((toD.getTime() - fromD.getTime()) / 86400000) + 1);
    const all = await this.apptRepo.find({ relations: { service: true, barber: true } as any, order: { startTime: 'DESC' } as any, take: 5000 });
    const inPeriod = all.filter((a) => {
      const ts = new Date((a as any).startTime).getTime();
      return !isNaN(ts) && ts >= fromD.getTime() && ts <= toD.getTime();
    });
    const completed = inPeriod.filter((a) => String(a.status) === 'completed');
    const cancelled = inPeriod.filter((a) => String(a.status) === 'cancelled');
    const noShow = inPeriod.filter((a) => String(a.status) === 'no_show');
    const pending = inPeriod.filter((a) => String(a.status) === 'pending');
    const confirmed = inPeriod.filter((a) => String(a.status) === 'confirmed');
    const revenueTotal = completed.reduce((s, a: any) => s + Number(a.service?.price ?? 0), 0);
    const avgPerCompleted = completed.length ? revenueTotal / completed.length : 0;
    const byDayMap = new Map<string, { count: number; revenue: number }>();
    for (const a of inPeriod) {
      const k = new Date((a as any).startTime).toISOString().slice(0, 10);
      const cur = byDayMap.get(k) ?? { count: 0, revenue: 0 };
      cur.count++;
      if (String(a.status) === 'completed') cur.revenue += Number((a as any).service?.price ?? 0);
      byDayMap.set(k, cur);
    }
    const byDayKeys = Array.from(byDayMap.keys()).sort();
    const dailyBreakdown = byDayKeys.map((k) => ({ date: k, count: byDayMap.get(k)!.count, revenue: Math.round(byDayMap.get(k)!.revenue * 100) / 100 }));
    const revenueByDay: Record<string, number> = {};
    for (const d of dailyBreakdown) revenueByDay[d.date] = d.revenue;
    const svcMap = new Map<string, { name: string; count: number; revenue: number }>();
    for (const a of inPeriod) {
      const sid = String((a as any).serviceId ?? (a as any).service?.id ?? 'unknown');
      const name = String((a as any).service?.name ?? sid.slice(0, 8));
      const cur = svcMap.get(sid) ?? { name, count: 0, revenue: 0 };
      cur.name = name;
      cur.count++;
      if (String(a.status) === 'completed') cur.revenue += Number((a as any).service?.price ?? 0);
      svcMap.set(sid, cur);
    }
    const topServices = [...svcMap.values()].sort((a, b) => b.count - a.count).slice(0, 5).map((x) => ({ name: x.name, count: x.count, revenue: Math.round(x.revenue * 100) / 100 }));
    const barberMap = new Map<string, { name: string; count: number; revenue: number; completed: number }>();
    for (const a of inPeriod) {
      const bid = String((a as any).barberId ?? (a as any).barber?.id ?? 'unknown');
      const name = String((a as any).barber?.fullName ?? bid.slice(0, 8));
      const cur = barberMap.get(bid) ?? { name, count: 0, revenue: 0, completed: 0 };
      cur.name = name;
      cur.count++;
      if (String(a.status) === 'completed') { cur.completed++; cur.revenue += Number((a as any).service?.price ?? 0); }
      barberMap.set(bid, cur);
    }
    const topBarbers = [...barberMap.values()].sort((a, b) => b.count - a.count).slice(0, 5).map((x) => ({ name: x.name, count: x.count, revenue: Math.round(x.revenue * 100) / 100, completionRate: x.count ? Math.round((x.completed / x.count) * 1000) / 1000 : 0 }));
    const totalCustomers = await this.userRepo.createQueryBuilder('u').where('LOWER(u.role) IN (:...roles)', { roles: ['customer', 'user'] }).getCount().catch(() => 0);
    const distinctUserIds = new Set<string>(inPeriod.map((a: any) => String(a.userId ?? a.user?.id ?? '' )).filter(Boolean));
    const activeCustomersInPeriod = distinctUserIds.size;
    let newCustomersInPeriod = 0;
    try {
      const newUsers = await this.userRepo.createQueryBuilder('u').where('LOWER(u.role) IN (:...roles)', { roles: ['customer', 'user'] }).andWhere('u.createdAt >= :from AND u.createdAt <= :to', { from: fromD, to: toD }).getCount();
      newCustomersInPeriod = newUsers;
    } catch { newCustomersInPeriod = 0; }
    const perUser = new Map<string, number>();
    for (const a of inPeriod) { const uid = String((a as any).userId ?? ''); if (!uid) continue; perUser.set(uid, (perUser.get(uid) ?? 0) + 1); }
    let repeat = 0;
    for (const [, c] of perUser) if (c >= 2) repeat++;
    const repeatRate = activeCustomersInPeriod ? repeat / activeCustomersInPeriod : null;
    const total = inPeriod.length;
    const cancellationRate = total ? cancelled.length / total : 0;
    const noShowRate = total ? noShow.length / total : 0;
    const completionRate = total ? completed.length / total : 0;
    let weekOverWeekCountChange: number | null = null;
    let weekOverWeekRevenueChange: number | null = null;
    if (days >= 14) {
      const last7From = new Date(toD.getTime() - 6 * 86400000); last7From.setUTCHours(0, 0, 0, 0);
      const prev7From = new Date(toD.getTime() - 13 * 86400000); prev7From.setUTCHours(0, 0, 0, 0);
      const prev7To = new Date(toD.getTime() - 7 * 86400000); prev7To.setUTCHours(23, 59, 59, 999);
      const last7 = inPeriod.filter((a) => { const ts = new Date((a as any).startTime).getTime(); return ts >= last7From.getTime() && ts <= toD.getTime(); });
      const prev7 = inPeriod.filter((a) => { const ts = new Date((a as any).startTime).getTime(); return ts >= prev7From.getTime() && ts <= prev7To.getTime(); });
      const last7Rev = last7.filter((a) => String(a.status) === 'completed').reduce((s, a: any) => s + Number(a.service?.price ?? 0), 0);
      const prev7Rev = prev7.filter((a) => String(a.status) === 'completed').reduce((s, a: any) => s + Number(a.service?.price ?? 0), 0);
      if (prev7.length) weekOverWeekCountChange = (last7.length - prev7.length) / prev7.length;
      if (prev7Rev) weekOverWeekRevenueChange = (last7Rev - prev7Rev) / prev7Rev;
      else if (last7Rev) weekOverWeekRevenueChange = 1;
    }
    const input: BusinessInsightsInput = {
      period: { from: fromD.toISOString().slice(0, 10), to: toD.toISOString().slice(0, 10), days },
      totals: { totalAppointments: total, pending: pending.length, confirmed: confirmed.length, completed: completed.length, cancelled: cancelled.length, noShow: noShow.length },
      revenue: { total: Math.round(revenueTotal * 100) / 100, avgPerCompleted: Math.round(avgPerCompleted * 100) / 100, byDay: revenueByDay },
      topServices,
      topBarbers,
      customers: { totalCustomers, activeCustomersInPeriod, newCustomersInPeriod, repeatRate: repeatRate != null ? Math.round(repeatRate * 1000) / 1000 : null },
      rates: { cancellationRate: Math.round(cancellationRate * 1000) / 1000, noShowRate: Math.round(noShowRate * 1000) / 1000, completionRate: Math.round(completionRate * 1000) / 1000 },
      dailyBreakdown,
      trends: { weekOverWeekCountChange: weekOverWeekCountChange != null ? Math.round(weekOverWeekCountChange * 1000) / 1000 : null, weekOverWeekRevenueChange: weekOverWeekRevenueChange != null ? Math.round(weekOverWeekRevenueChange * 1000) / 1000 : null },
    };
    const timeoutMs = Number(process.env.AI_BUSINESS_INSIGHTS_TIMEOUT_MS || 15000);
    let result: BusinessInsightsResult;
    const fn = (this.provider as AiProvider & { businessInsights?: unknown }).businessInsights;
    if (typeof fn === 'function') {
      try {
        result = await withTimeout((fn as any).call(this.provider, input) as Promise<BusinessInsightsResult>, timeoutMs, 'AI business insights timeout');
        if (!result?.summaryFa || !Array.isArray(result.insightsFa)) throw new Error('empty');
      } catch (e: any) {
        if (e?.message !== 'AI business insights timeout') this.logger.warn(`AI businessInsights failed: ${e?.message ?? e}`);
        result = await new HeuristicProvider().businessInsights!(input);
      }
    } else {
      result = await new HeuristicProvider().businessInsights!(input);
    }
    const periodLabelFa = `${input.period.from} تا ${input.period.to} (${days} روز)`;
    return { ...result, aggregates: { period: input.period, totals: input.totals, revenue: input.revenue, topServices: input.topServices, topBarbers: input.topBarbers, customers: input.customers, rates: input.rates, dailyBreakdown: input.dailyBreakdown, trends: input.trends }, periodLabelFa };
  }

  async smartReminderForSelf(actor: any): Promise<SmartReminderResult & { customer: { id: string; name: string; family: string; username: string }; stats: SmartReminderInput['stats']; recentAppointments: SmartReminderInput['recentAppointments'] }> {
    const id = actor?.id ?? actor?.sub;
    if (!id) throw new BadRequestException('Unauthorized');
    return this.smartReminderFor(String(id));
  }

  async recommendServices(input: {
    hairstyle: HairRecommendation;
    profile?: { name?: string; family?: string; username?: string };
    barberId?: string;
    barbershopId?: string;
  }): Promise<{
    recommendations: (ServiceRecommendation & { service: Service })[];
    meta: { provider: string; model: string };
  }> {
    if (!input.hairstyle?.id)
      throw new BadRequestException('hairstyleId or hairstyle required');
    const where: Record<string, unknown> = {};
    if (input.barberId) where.barberId = input.barberId;
    if (input.barbershopId) where.barbershopId = input.barbershopId;
    const services = await this.svcRepo.find({
      where: Object.keys(where).length ? where : {},
      order: { createdAt: 'DESC' } as any,
      take: 50,
    });
    if (!services.length)
      return {
        recommendations: [],
        meta: { provider: this.provider.name, model: this.provider.model },
      };
    const svcInput: ServiceRecommendInput = {
      hairstyle: input.hairstyle,
      profile: input.profile,
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: Number(s.price),
        duration: s.duration,
        icon: s.icon,
      })),
    };
    let recs: ServiceRecommendation[] = [];
    const timeoutMs = Number(
      process.env.AI_SERVICE_RECOMMEND_TIMEOUT_MS || 12000,
    );
    const fn = (this.provider as AiProvider & { recommendServices?: unknown })
      .recommendServices;
    if (typeof fn === 'function') {
      try {
        recs = await withTimeout(
          (fn as any).call(this.provider, svcInput) as Promise<
            ServiceRecommendation[]
          >,
          timeoutMs,
          'AI service recommend timeout',
        );
      } catch (e: any) {
        if (e?.message !== 'AI service recommend timeout')
          this.logger.warn(`AI recommendServices failed: ${e?.message ?? e}`);
        const h = new HeuristicProvider();
        recs = await h.recommendServices(svcInput);
      }
    } else {
      const h = new HeuristicProvider();
      recs = await h.recommendServices(svcInput);
    }
    const byId = new Map(services.map((s) => [s.id, s]));
    const enriched = recs
      .filter((r) => byId.has(r.serviceId))
      .map((r) => ({ ...r, service: byId.get(r.serviceId)! }));
    return {
      recommendations: enriched,
      meta: { provider: this.provider.name, model: this.provider.model },
    };
  }

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
    try {
      const h = new HeuristicProvider();
      const svg = await h.preview(buffer, mime, rec);
      if (svg) return { previewImage: svg, mime: 'image/svg+xml' };
    } catch {}
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
