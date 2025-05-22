export type LanguageStatus = 'living' | 'dead' | 'proto';

export interface ILanguage {
  id: string;
  name: string;
  autonym: string;
  familyId: string | null;
  parentId: string | null;
  status: LanguageStatus;
  era: string;
  created: Date;
}

export interface ILanguageSummaryNotes {
  description: string;
  phonologyNotes: string;
  orthographyNotes: string;
}

export interface IDictionarySettings {
  showWordIpa: boolean;
  canEditIrregularStems: boolean;
}

export interface IOrthographySettings {
  alphabeticalOrder: string[];
  hasSetAlphabeticalOrder: boolean;
  caseSensitive: boolean;
}
