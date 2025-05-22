import { useQuery } from '@tanstack/react-query';

import {
  ApplySCARulesQueryResult,
  ICategory,
  IPhone,
  IPronunciationEstimationSettings
} from '@/types/phones';
import { ITitledError } from '@/types/titledError';

import { getBackendJson, sendBackendJsonForQuery } from '@/utils/global/queries';

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
}

export function useEstimateWordIPAQuery(langId: string, word: string, enabled: boolean = true) {
  return useQuery<string, ITitledError>({
    queryKey: ['languages', langId, 'estimate-ipa', word],
    queryFn: async () => await sendBackendJsonForQuery(
      `languages/${langId}/estimate-ipa`, 'POST', { word }
    ),
    staleTime: 0,
    enabled
  });
}

export function useLanguagePhones(id: string) {
  return useQuery<IPhone[], ITitledError>({
    queryKey: ['languages', id, 'phones'],
    queryFn: async () => await getBackendJson(`languages/${id}/phones`)
  });
}

export function useLanguageOrthographyCategories(id: string) {
  return useQuery<ICategory[], ITitledError>({
    queryKey: ['languages', id, 'orth-categories'],
    queryFn: async () => await getBackendJson(`languages/${id}/orth-categories`),
    staleTime: 0
  });
}

export function useLanguagePhoneCategories(id: string) {
  return useQuery<ICategory[], ITitledError>({
    queryKey: ['languages', id, 'phone-categories'],
    queryFn: async () => await getBackendJson(`languages/${id}/phone-categories`),
    staleTime: 0
  });
}

export function useLanguagePronunciationEstimationSettings(id: string) {
  return useQuery<IPronunciationEstimationSettings, ITitledError>({
    queryKey: ['languages', id, 'pronunciation-estimation'],
    queryFn: async () => await getBackendJson(`languages/${id}/pronunciation-estimation`)
  });
}
