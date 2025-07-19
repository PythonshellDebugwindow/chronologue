import { LanguageStatus } from './languages';

export interface IWord {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  pos: string;
  etymology: string;
  notes: string;
  langId: string;
  created: Date;
  updated: Date | null;
}

export interface IPartOfSpeech {
  code: string;
  name: string;
}

export interface IWordClass {
  id: string;
  pos: string;
  code: string;
  name: string;
}

export type IWordClassNoPOS = Omit<IWordClass, 'pos'>;

export type DictionaryFilterField = Omit<keyof IWord, 'created' | 'updated'> | '';
export type DictionaryFilterType = 'begins' | 'contains' | 'ends' | 'exact' | 'regexp';

export interface IDictionaryFilter {
  field: DictionaryFilterField;
  type: DictionaryFilterType;
  value: string;
  matchCase: boolean;
  sortField: keyof IWord;
  sortDir: 'asc' | 'desc';
}

export interface IDictionaryField {
  name: keyof IWord;
  isDisplaying: boolean;
}

export interface IIdenticalWordOverview {
  id: string;
  word: string;
  meaning: string;
  pos: string;
}

export type IDerivationRulesetOverview = {
  langId: string;
  langName: string;
} & ({
  familyId: string;
  familyName: string;
} | {
  familyId: null;
  familyName: null;
});

export interface IDerivationRuleset {
  rules: string;
  fromIpa: boolean;
}

export interface IWordDerivation {
  derived: null | {
    success: true;
    result: string;
  } | {
    success: false;
    message: string;
  };
}

export interface IWordOverviewWithLanguage {
  langId: string;
  langName: string;
  langStatus: LanguageStatus;
  word: string;
}

export interface IWordDescendantOverview {
  id: string;
  word: string;
  langId: string;
  langName: string;
  langStatus: LanguageStatus;
  parentId: string;
  isBorrowed: boolean;
}
