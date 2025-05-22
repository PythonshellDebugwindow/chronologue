export interface ITranslation {
  id: string;
  content: string;
  notes: string;
  created: Date;
}

export interface ITranslationOverview {
  id: string;
  content: string;
  created: Date;
  numLanguages: number;
}

export interface ILanguageTranslation {
  langId: string;
  content: string;
  ipa: string;
  gloss: string;
  notes: string;
  workInProgress: boolean;
  created: Date;
}

export interface ILanguageTranslationOverview {
  translId: string;
  translText: string;
  content: string;
  workInProgress: boolean;
  created: Date;
}
