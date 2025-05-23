import { useQuery } from '@tanstack/react-query';

import { ITitledError } from '@/types/titledError';
import {
  ILanguageTranslation,
  ILanguageTranslationOverview,
  ITranslation,
  ITranslationOverview
} from '@/types/translations';

import {
  getBackendJson,
  parseRecordDates,
  parseSingleRecordDates
} from '@/utils/global/queries';

export function useLanguageTranslation(langId: string, translId: string) {
  return useQuery<ILanguageTranslation | null, ITitledError>({
    queryKey: ['translations', translId, 'languages', langId],
    queryFn: async () => {
      const langTr = await getBackendJson(`translations/${translId}/languages/${langId}`);
      return langTr && parseSingleRecordDates(langTr);
    }
  });
}

export function useLanguageTranslations(langId: string) {
  return useQuery<ILanguageTranslationOverview[], ITitledError>({
    queryKey: ['languages', langId, 'translations'],
    queryFn: async () => parseRecordDates(await getBackendJson(`languages/${langId}/translations`))
  });
}

export function useLanguageTranslationIds(langId: string) {
  return useQuery<string[], ITitledError>({
    queryKey: ['languages', langId, 'translation-ids'],
    queryFn: async () => await getBackendJson(`languages/${langId}/translation-ids`)
  });
}

export function useTranslation(id: string) {
  return useQuery<ITranslation, ITitledError>({
    queryKey: ['translations', id],
    queryFn: async () => parseSingleRecordDates(await getBackendJson(`translations/${id}`))
  });
}

export function useTranslationLanguages(id: string) {
  return useQuery<ILanguageTranslation[], ITitledError>({
    queryKey: ['translations', id, 'languages'],
    queryFn: async () => parseRecordDates(await getBackendJson(`translations/${id}/languages`))
  });
}

export function useTranslations() {
  return useQuery<ITranslationOverview[], ITitledError>({
    queryKey: ['translations'],
    queryFn: async () => parseRecordDates(await getBackendJson('translations'))
  });
}
