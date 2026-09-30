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
export interface AiProvider {
  readonly name: string;
  readonly model: string;
  recommend(buffer: Buffer, mime: string): Promise<AiAnalysisResult>;
  preview?(
    buffer: Buffer,
    mime: string,
    rec: HairRecommendation,
  ): Promise<string | null>;
}
export const AI_PROVIDER = 'AI_PROVIDER';
