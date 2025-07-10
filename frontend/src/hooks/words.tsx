import { useQuery } from '@tanstack/react-query';

import { ITitledError } from '@/types/titledError';
import {
  IDerivationRuleset,
  IDerivationRulesetOverview,
  IIdenticalWordOverview,
  IPartOfSpeech,
  IWord,
  IWordClassNoPOS,
  IWordDerivation,
  IWordOverviewWithLanguage
} from '@/types/words';

import {
  getBackendJson,
  parseRecordDates,
  parseSingleRecordDates,
  sendBackendJsonForQuery
} from '@/utils/global/queries';

export function useLanguageDerivationRuleset(destLangId: string, srcLangId: string) {
  return useQuery<IDerivationRuleset | null, ITitledError>({
    queryKey: ['languages', destLangId, 'derivation-rules', srcLangId],
    queryFn: async () => await getBackendJson(
      `languages/${destLangId}/derivation-rules/${srcLangId}`
    ),
    staleTime: 0
  });
}

export function useLanguageDerivationRulesetIds(destLangId: string) {
  return useQuery<IDerivationRulesetOverview[], ITitledError>({
    queryKey: ['languages', destLangId, 'derivation-rules'],
    queryFn: async () => await getBackendJson(`languages/${destLangId}/derivation-rules`),
    staleTime: 0
  });
}

export function useLanguageStringHomonyms(langId: string, word: string) {
  return useQuery<IIdenticalWordOverview[], ITitledError>({
    queryKey: ['languages', langId, 'homonyms', word],
    queryFn: async () => await sendBackendJsonForQuery(
      `languages/${langId}/homonyms`, 'POST', { word }
    ),
    staleTime: 0
  });
}

export function useLanguageStringSynonyms(langId: string, meaning: string) {
  return useQuery<IIdenticalWordOverview[], ITitledError>({
    queryKey: ['languages', langId, 'synonyms', meaning],
    queryFn: async () => await sendBackendJsonForQuery(
      `languages/${langId}/synonyms`, 'POST', { meaning }
    ),
    staleTime: 0
  });
}

export function useLanguageWordCount(id: string) {
  return useQuery<number, ITitledError>({
    queryKey: ['languages', id, 'word-count'],
    queryFn: async () => await getBackendJson(`languages/${id}/word-count`)
  });
}

export function useLanguageWordHomonyms(wordId: string) {
  return useQuery<IIdenticalWordOverview[], ITitledError>({
    queryKey: ['words', wordId, 'homonyms'],
    queryFn: async () => await getBackendJson(`words/${wordId}/homonyms`)
  });
}

export function useLanguageWordSynonyms(wordId: string) {
  return useQuery<IIdenticalWordOverview[], ITitledError>({
    queryKey: ['words', wordId, 'synonyms'],
    queryFn: async () => await getBackendJson(`words/${wordId}/synonyms`)
  });
}

export function useLanguageWords(id: string) {
  return useQuery<IWord[], ITitledError>({
    queryKey: ['languages', id, 'words'],
    queryFn: async () => parseRecordDates(await getBackendJson(`languages/${id}/words`))
  });
}

export function usePartsOfSpeech() {
  return useQuery<IPartOfSpeech[], ITitledError>({
    queryKey: ['parts-of-speech'],
    queryFn: async () => await getBackendJson(`parts-of-speech`)
  });
}

export function useWord(id: string, enabled: boolean = true) {
  return useQuery<IWord, ITitledError>({
    queryKey: ['words', id],
    queryFn: async () => parseSingleRecordDates(await getBackendJson(`words/${id}`)),
    enabled
  });
}

export function useWordClassIds(wordId: string, enabled: boolean = true) {
  return useQuery<string[], ITitledError>({
    queryKey: ['words', wordId, 'class-ids'],
    queryFn: async () => await getBackendJson(`words/${wordId}/class-ids`),
    enabled
  });
}

export function useWordClasses(wordId: string) {
  return useQuery<IWordClassNoPOS[], ITitledError>({
    queryKey: ['words', wordId, 'classes'],
    queryFn: async () => await getBackendJson(`words/${wordId}/classes`)
  });
}

export function useWordDerivationIntoLanguage(wordId: string, langId: string, enabled: boolean) {
  return useQuery<IWordDerivation, ITitledError>({
    queryKey: ['words', wordId, 'derivation', langId],
    queryFn: async () => await getBackendJson(`words/${wordId}/derivation/${langId}`),
    enabled
  });
}

export function useWordOverviewWithLanguage(wordId: string) {
  return useQuery<IWordOverviewWithLanguage, ITitledError>({
    queryKey: ['words', wordId, 'overview-with-language'],
    queryFn: async () => await getBackendJson(`words/${wordId}/overview-with-language`)
  });
}
