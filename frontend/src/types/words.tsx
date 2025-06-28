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
