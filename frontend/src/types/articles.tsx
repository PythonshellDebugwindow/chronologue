export interface IArticle {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  created: Date;
  updated: Date | null;
  tags: string[];
}

export interface IArticleOverview {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  updated: Date;
  tags: string[];
}

export interface IArticleFolder {
  id: string;
  name: string;
}
