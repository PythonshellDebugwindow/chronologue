import { useQuery } from '@tanstack/react-query';

import { ITitledError } from '@/types/titledError';
import { IHomonymOverview, IPartOfSpeech, IWord, IWordClassNoPOS } from '@/types/words';

import {
  getBackendJson,
  parseRecordDates,
  parseSingleRecordDates,
  sendBackendJsonForQuery
} from '@/utils/global/queries';

export function useLanguageHomonyms(langId: string, word: string) {
  return useQuery<IHomonymOverview[], ITitledError>({
    queryKey: ['languages', langId, 'homonyms', word],
    queryFn: async () => await sendBackendJsonForQuery(
      `languages/${langId}/homonyms`, 'POST', { word }
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
