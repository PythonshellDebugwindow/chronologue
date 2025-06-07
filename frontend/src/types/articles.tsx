export interface IArticle {
  id: string;
  title: string;
  content: string;
  created: Date;
  updated: Date | null;
  tags: string[];
}

export interface IArticleOverview {
  id: string;
  title: string;
  content: string;
  updated: Date;
  tags: string[];
}
