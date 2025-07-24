export interface AIAnalysisResult {
  id: number;
  post_id: number;
  trend_analysis: string;
  sentiment_analysis: string;
  discussion_quality: string;
  persuasion_effectiveness: string;
  overall_assessment: string;
  confidence_score: number;
  analyzed_at: string;
  created_at: string;
}
