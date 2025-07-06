import { useQuery } from '@tanstack/react-query';

import {
  IDictionarySettings,
  ILanguage,
  ILanguageSummaryNotes,
  IOrthographySettings
} from '@/types/languages';
import { ITitledError } from '@/types/titledError';
import { IWordClass } from '@/types/words';

import {
  getBackendJson,
  parseRecordDates,
  parseSingleRecordDates
} from '@/utils/global/queries';

export function useLanguage(id: string, enabled: boolean = true) {
  return useQuery<ILanguage, ITitledError>({
    queryKey: ['languages', id],
    queryFn: async () => parseSingleRecordDates(await getBackendJson(`languages/${id}`)),
    enabled
  });
}

export function useLanguageSummaryNotes(id: string) {
  return useQuery<ILanguageSummaryNotes, ITitledError>({
    queryKey: ['languages', id, 'summary-notes'],
    queryFn: async () => parseSingleRecordDates(await getBackendJson(`languages/${id}/summary-notes`)),
    staleTime: 0
  });
}

export function useLanguageDescendants(id: string) {
  return useQuery<ILanguage[], ITitledError>({
    queryKey: ['languages', id, 'descendants'],
    queryFn: async () => parseRecordDates(await getBackendJson(`languages/${id}/descendants`))
  });
}

export function useLanguageDictionarySettings(id: string) {
  return useQuery<IDictionarySettings, ITitledError>({
    queryKey: ['languages', id, 'dictionary-settings'],
    queryFn: async () => await getBackendJson(`languages/${id}/dictionary-settings`),
    staleTime: 0
  });
}

export function useLanguageOrthographySettings(id: string) {
  return useQuery<IOrthographySettings, ITitledError>({
    queryKey: ['languages', id, 'orth-settings'],
    queryFn: async () => await getBackendJson(`languages/${id}/orth-settings`)
  });
}

export function useLanguageWordClasses(id: string) {
  return useQuery<IWordClass[], ITitledError>({
    queryKey: ['languages', id, 'word-classes'],
    queryFn: async () => await getBackendJson(`languages/${id}/word-classes`)
  });
}
