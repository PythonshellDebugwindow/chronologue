import { useQuery } from '@tanstack/react-query';

import { ILanguage } from './languageData.tsx';
import {
  getBackendJson, parseRecordDates, parseSingleRecordDates,
  sendBackendJson, sendBackendRequest, ITitledError
} from './utils.tsx';

export interface IFamily {
  id: string;
  name: string;
  description: string;
  created: Date;
};

type IAddFamilyArgument = Omit<IFamily, 'id' | 'created'>;

export async function addFamily(data: IAddFamilyArgument) {
  return await sendBackendJson('families', 'POST', data);
};

export async function deleteFamily(id: string) {
  return await sendBackendRequest(`families/${id}`, 'DELETE');
};

export async function editFamily(id: string, data: IAddFamilyArgument) {
  return await sendBackendJson(`families/${id}`, 'PUT', data);
};

export function useFamilies() {
  return useQuery<IFamily[], ITitledError>({
    queryKey: ['families'],
    queryFn: async () => parseRecordDates(await getBackendJson('families'))
  });
};

export function useFamily(id: string) {
  return useQuery<IFamily, ITitledError>({
    queryKey: ['families', id],
    queryFn: async () => parseSingleRecordDates(await getBackendJson(`families/${id}`))
  });
};

export function useFamilyMembers(id: string) {
  return useQuery<ILanguage[], ITitledError>({
    queryKey: ['families', id, 'members'],
    queryFn: async () => parseRecordDates(await getBackendJson(`families/${id}/members`))
  });
};

export function useLanguageIsolates() {
  return useQuery<ILanguage[], ITitledError>({
    queryKey: ['language-isolates'],
    queryFn: async () => parseRecordDates(await getBackendJson('language-isolates'))
  });
}
