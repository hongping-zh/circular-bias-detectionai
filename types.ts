
export interface AnalysisResult {
  score: number;
  explanation: string;
  highlightedText: string;
}

export interface FullAnalysisResult extends AnalysisResult {
  originalGeneratedText: string;
  originalReferenceText: string;
}
