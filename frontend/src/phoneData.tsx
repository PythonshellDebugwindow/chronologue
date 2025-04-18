import { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  consonantPhones, phoneToString, vowelPhones
} from '@shared/phones.ts';

import { IOrthographySettings } from './languageData.tsx';
import {
  assertUnreachable, getBackendJson, sendBackendJsonForQuery, ITitledError
} from './utils.tsx';

export interface ICategory {
  letter: string;
  members: string[];
};

export interface IPronunciationEstimationSettings {
  letterReplacements: string;
  rewriteRules: string;
};

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
};

export interface IPhoneTableData {
  type: 'consonant' | 'vowel';
  horizontal: ReactNode[];
  vertical: ReactNode[];
  phones: string[][];
};

export const consonantData: IPhoneTableData = {
  type: 'consonant',
  horizontal: [
    "Bilabial", <>Labio-<br/>dental</>, "Dental", "Alveolar", <>Post-<br/>alveolar</>, "Retroflex",
    <>Alveolo-<br/>palatal</>, "Palatal", <>Labio-<br/>velar</>, "Velar", "Uvular",
    <>Pharyngeal/<br/>epiglottal</>, "Glottal", "Other"
  ],
  vertical: [
    "Nasal", "Plosive", "Affricate", "Fricative", "Approximant", "Tap/flap",
    "Trill", "Lateral affricate", "Lateral fricative", "Lateral approximant",
    "Lateral tap/flap", "Click", "Implosive"
  ],
  phones: consonantPhones
};

export const vowelData: IPhoneTableData = {
  type: 'vowel',
  horizontal: [
    "Front", <>Near-<br/>front</>, "Central", <>Near-<br/>back</>, "Back"
  ],
  vertical: [
    "Close", "Near-close", "Close-mid", "Mid", "Open-mid", "Near-open", "Open"
  ],
  phones: vowelPhones
};

export function hasDoubleWidthCell(base: string) {
  return base === "ə" || base === "ɐ";
};

export function phoneToStringWithBrackets(phone: IPhone) {
  const phoneString = phoneToString(phone);
  if(phone.isForeign) {
    return "(" + phoneString + ")";
  } else if(phone.isAllophone) {
    return "[" + phoneString + "]";
  } else {
    return "/" + phoneString + "/";
  }
};

export function getGraphFormatTypeForAlphabet(graph: string, orthSettings: IOrthographySettings) {
  if(orthSettings.caseSensitive) {
    return 'id';
  }
  const upper = graph.toUpperCase();
  if(upper === graph) {
    return 'id';
  } else if(upper.replace(/\p{M}/gu, "").length >= 2) {
    return 'upper-space-lower';
  } else {
    return 'upper-lower';
  }
}

export function formatGraphForAlphabet(graph: string, orthSettings: IOrthographySettings) {
  const formatType = getGraphFormatTypeForAlphabet(graph, orthSettings);
  switch(formatType) {
    case 'id':
      return graph;
    case 'upper-lower':
      return graph.toUpperCase() + graph;
    case 'upper-space-lower':
      return graph.toUpperCase() + " " + graph;
    default:
      assertUnreachable(formatType);
  }
};

export function formatPhoneForPhonologyTable(phone: IPhone) {
  const phoneString = phoneToString(phone);
  if(phone.isForeign) {
    return "(" + phoneString + ")";
  } else if(phone.isAllophone) {
    return "[" + phoneString + "]";
  } else {
    return phoneString;
  }
};

export type ApplySCARulesQueryResult = {
  success: true;
  result: string;
} | {
  success: false;
  message: string;
};

export function useApplySCARulesQuery(
  langId: string, input: string[], rules: string, categories: 'orth' | 'phone',
  enabled: boolean
) {
  return useQuery<ApplySCARulesQueryResult[], ITitledError>({
    queryKey: ['languages', langId, 'apply-sca-rules'],
    queryFn: async () => await sendBackendJsonForQuery(
      `languages/${langId}/apply-sca-rules`,
      'POST',
      { words: input, rules, categories }
    ),
    enabled
  });
};

export function useEstimateWordIPAQuery(langId: string, word: string, enabled: boolean) {
  return useQuery<string, ITitledError>({
    queryKey: ['languages', langId, 'estimate-ipa', word],
    queryFn: async () => await sendBackendJsonForQuery(
      `languages/${langId}/estimate-ipa`, 'POST', { word }
    ),
    staleTime: 0,
    enabled
  });
};

export function useLanguagePhones(id: string) {
  return useQuery<IPhone[], ITitledError>({
    queryKey: ['languages', id, 'phones'],
    queryFn: async () => await getBackendJson(`languages/${id}/phones`)
  });
};

export function useLanguageOrthographyCategories(id: string) {
  return useQuery<ICategory[], ITitledError>({
    queryKey: ['languages', id, 'orth-categories'],
    queryFn: async () => await getBackendJson(`languages/${id}/orth-categories`),
    staleTime: 0
  });
};

export function useLanguagePhoneCategories(id: string) {
  return useQuery<ICategory[], ITitledError>({
    queryKey: ['languages', id, 'phone-categories'],
    queryFn: async () => await getBackendJson(`languages/${id}/phone-categories`),
    staleTime: 0
  });
};

export function useLanguagePronunciationEstimationSettings(id: string) {
  return useQuery<IPronunciationEstimationSettings, ITitledError>({
    queryKey: ['languages', id, 'pronunciation-estimation'],
    queryFn: async () => await getBackendJson(`languages/${id}/pronunciation-estimation`)
  });
};
