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
}
export const AI_PROVIDER = 'AI_PROVIDER';
