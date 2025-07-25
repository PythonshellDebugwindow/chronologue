import { useQuery } from '@tanstack/react-query';

import { IFamily } from '@/types/families';
import { ILanguage } from '@/types/languages';
import { ITitledError } from '@/types/titledError';

import {
  getBackendJson,
  parseRecordDates,
  parseSingleRecordDates
} from '@/utils/global/queries';

export function useFamilies() {
  return useQuery<IFamily[], ITitledError>({
    queryKey: ['families'],
    queryFn: async () => parseRecordDates(await getBackendJson('families'))
  });
}

export function useFamily(id: string) {
  return useQuery<IFamily, ITitledError>({
    queryKey: ['families', id],
    queryFn: async () => parseSingleRecordDates(await getBackendJson(`families/${id}`))
  });
}

export function useFamilyMembers(id: string | null) {
  const queryKey = id ? ['families', id, 'members'] : ['language-isolates'];
  return useQuery<ILanguage[], ITitledError>({
    queryKey,
    queryFn: async () => parseRecordDates(await getBackendJson(queryKey.join('/')))
  });
}

export function useLanguageIsolates() {
  return useFamilyMembers(null);
}
