import { ReactNode } from 'react';

export interface ICategory {
  letter: string;
  members: string[];
}

export interface IPronunciationEstimationSettings {
  letterReplacements: string;
  rewriteRules: string;
}

export type PhoneType = 'consonant' | 'vowel' | 'other';

export interface IPhone {
  id: string | null;
  base: string;
  type: PhoneType;
  graph: string;
  qualities: string[];
  isAllophone: boolean;
  allophoneOf: string;
  isForeign: boolean;
  notes: string;
}

export interface IPhoneTableData {
  type: 'consonant' | 'vowel';
  horizontal: ReactNode[];
  vertical: ReactNode[];
  phones: string[][];
}

export type ApplySCARulesQueryResult = {
  success: true;
  result: string;
} | {
  success: false;
  message: string;
};
