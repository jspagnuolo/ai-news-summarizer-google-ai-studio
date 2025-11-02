export interface ArticleSource {
  title: string;
  url: string;
  source: string;
  publishedDate: string;
  language: string;
  region: string;
}

export interface FetchedArticle {
  title: string;
  url: string;
  publishedDate: Date;
  description: string;
  source: string;
  // from config
  language: string;
  region: string;
  perspective: string;
}

export interface Summary {
  title: string;
  date: string;
  topic: string;
  topicName: string;
  sources: ArticleSource[];
  articleCount: number;
  venezuelanSources: number;
  usSources: number;
  overallHighlights: string[];
  usPerspective: string[];
  venezuelanPerspective: string[];
}

export interface PipelineCallbacks {
  onLog: (message: string) => void;
  onStepChange: (stepIndex: number) => void;
  onSummaryGenerated: (summary: Summary) => void;
}
