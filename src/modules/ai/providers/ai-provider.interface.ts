export type FaceShape =
  | 'oval'
  | 'round'
  | 'square'
  | 'heart'
  | 'oblong'
  | 'diamond'
  | 'unknown';
export interface HairCharacteristics {
  texture?: string;
  length?: string;
  density?: string;
  color?: string;
}
export interface HairRecommendation {
  id: string;
  title: string;
  titleFa: string;
  category: string;
  length: 'short' | 'medium' | 'long';
  description: string;
  descriptionFa: string;
  reason: string;
  reasonFa: string;
  stylingTips: string[];
  stylingTipsFa: string[];
  confidence: number;
  suitableFaceShapes: FaceShape[];
  maintenance: 'low' | 'medium' | 'high';
  tags: string[];
}
export interface AiAnalysisResult {
  analysis: {
    faceShape: FaceShape;
    faceShapeConfidence: number;
    hairCharacteristics: HairCharacteristics;
    detectedFeatures: string[];
    confidence: number;
  };
  recommendations: HairRecommendation[];
  meta: { provider: string; model: string };
}
export interface ServiceRecommendInput {
  hairstyle: HairRecommendation;
  profile?: { name?: string; family?: string; username?: string };
  services: Array<{
    id: string;
    name: string;
    description?: string | null;
    price: number;
    duration: number;
    icon?: string | null;
  }>;
}
export interface ServiceRecommendation {
  serviceId: string;
  reason: string;
  reasonFa: string;
  confidence: number;
}
export interface CustomerProfileInput {
  customer: { id: string; name: string; family: string; username: string; phoneNumber?: string; createdAt?: string };
  stats: { totalAppointments: number; completed: number; cancelled: number; noShow: number; pending: number; confirmed: number; lastVisitAt: string | null; firstVisitAt: string | null; avgDaysBetween: number | null; favoriteServiceNames: string[]; favoriteBarberName: string | null; preferredDayOfWeek: string | null; totalServices: number };
  recentAppointments: Array<{ date: string; serviceName: string; barberName: string; status: string }>;
  services: Array<{ id: string; name: string; description?: string | null; price: number; duration: number }>;
}
export interface CustomerRecommendation { title: string; titleFa: string; reason: string; reasonFa: string; serviceId?: string; confidence: number; tags?: string[] }
export interface CustomerProfileResult { summary: string; summaryFa: string; personaFa: string; insights: string[]; insightsFa: string[]; preferencesFa: string; recommendations: CustomerRecommendation[]; meta: { provider: string; model: string } }
export interface SmartReminderInput {
  customer: { id: string; name: string; family: string; username: string; phoneNumber?: string; createdAt?: string };
  stats: { totalAppointments: number; completed: number; cancelled: number; noShow: number; pending: number; confirmed: number; lastVisitAt: string | null; firstVisitAt: string | null; avgDaysBetween: number | null; favoriteServiceNames: string[]; favoriteBarberName: string | null; preferredDayOfWeek: string | null; totalServices: number; daysSinceLastVisit: number | null };
  recentAppointments: Array<{ date: string; serviceName: string; barberName: string; status: string }>;
  services: Array<{ id: string; name: string; description?: string | null; price: number; duration: number }>;
}
export interface SmartReminderResult {
  predictedDate: string | null;
  predictedDaysFromNow: number | null;
  frequencyLabelFa: string;
  confidence: number;
  message: string;
  messageFa: string;
  insightsFa: string[];
  suggestedServices: Array<{ serviceId?: string; title: string; titleFa: string; reasonFa: string; confidence: number }>;
  meta: { provider: string; model: string };
}
export interface BusinessInsightsInput {
  period: { from: string | null; to: string | null; days: number };
  totals: { totalAppointments: number; pending: number; confirmed: number; completed: number; cancelled: number; noShow: number };
  revenue: { total: number; avgPerCompleted: number; byDay: Record<string, number> };
  topServices: Array<{ name: string; count: number; revenue: number }>;
  topBarbers: Array<{ name: string; count: number; revenue: number; completionRate: number }>;
  customers: { totalCustomers: number; activeCustomersInPeriod: number; newCustomersInPeriod: number; repeatRate: number | null };
  rates: { cancellationRate: number; noShowRate: number; completionRate: number };
  dailyBreakdown: Array<{ date: string; count: number; revenue: number }>;
  trends: { weekOverWeekCountChange: number | null; weekOverWeekRevenueChange: number | null };
}
export interface BusinessTrend { label: string; labelFa: string; direction: 'up' | 'down' | 'stable'; changePercent: number | null; period: string; detailFa?: string }
export interface BusinessAnomaly { title: string; titleFa: string; detail: string; detailFa: string; severity: 'low' | 'medium' | 'high'; metric?: string }
export interface BusinessRecommendation { title: string; titleFa: string; reason: string; reasonFa: string; priority: 'low' | 'medium' | 'high'; actionFa: string; expectedImpactFa?: string }
export interface BusinessInsightsResult {
  summary: string;
  summaryFa: string;
  insights: string[];
  insightsFa: string[];
  trends: BusinessTrend[];
  anomalies: BusinessAnomaly[];
  recommendations: BusinessRecommendation[];
  meta: { provider: string; model: string };
}
export interface AiProvider {
  readonly name: string;
  readonly model: string;
  recommend(buffer: Buffer, mime: string): Promise<AiAnalysisResult>;
  preview?(
    buffer: Buffer,
    mime: string,
    rec: HairRecommendation,
  ): Promise<string | null>;
  recommendServices?(
    input: ServiceRecommendInput,
  ): Promise<ServiceRecommendation[]>;
  customerProfile?(input: CustomerProfileInput): Promise<CustomerProfileResult>;
  smartReminder?(input: SmartReminderInput): Promise<SmartReminderResult>;
  businessInsights?(input: BusinessInsightsInput): Promise<BusinessInsightsResult>;
}
export const AI_PROVIDER = 'AI_PROVIDER';
