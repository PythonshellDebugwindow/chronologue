import { useQuery } from '@tanstack/react-query';

import { IWordClass } from './wordData.tsx';
import {
  getBackendJson, parseRecordDates, parseSingleRecordDates,
  sendBackendJson, sendBackendRequest, ITitledError
} from './utils.tsx';

export interface ILanguage {
  id: string;
  name: string;
  autonym: string;
  familyId: string | null;
  parentId: string | null;
  status: string;
  era: string;
  created: Date;
};

export interface ILanguageSummaryNotes {
  description: string;
  phonologyNotes: string;
  orthographyNotes: string;
};

export interface IDictionarySettings {
  showWordIpa: boolean;
};

export interface IOrthographySettings {
  alphabeticalOrder: string[];
  hasSetAlphabeticalOrder: boolean;
  caseSensitive: boolean;
};

type IAddLanguageArgument = Omit<ILanguage, 'id' | 'created'>;

export async function addLanguage(data: IAddLanguageArgument) {
  return await sendBackendJson('languages', 'POST', data);
};

export async function deleteLanguage(id: string) {
  return await sendBackendRequest(`languages/${id}`, 'DELETE');
};

export async function editLanguage(id: string, data: IAddLanguageArgument) {
  return await sendBackendJson(`languages/${id}`, 'PUT', data);
};

export function useLanguage(id: string) {
  return useQuery<ILanguage, ITitledError>({
    queryKey: ['languages', id],
    queryFn: async () => parseSingleRecordDates(await getBackendJson(`languages/${id}`))
  });
};

export function useLanguageSummaryNotes(id: string) {
  return useQuery<ILanguageSummaryNotes, ITitledError>({
    queryKey: ['languages', id, 'summary-notes'],
    queryFn: async () => parseSingleRecordDates(await getBackendJson(`languages/${id}/summary-notes`)),
    staleTime: 0
  });
};

export function useLanguageDescendants(id: string) {
  return useQuery<ILanguage[], ITitledError>({
    queryKey: ['languages', id, 'descendants'],
    queryFn: async () => parseRecordDates(await getBackendJson(`languages/${id}/descendants`))
  });
};

export function useLanguageDictionarySettings(id: string) {
  return useQuery<IDictionarySettings, ITitledError>({
    queryKey: ['languages', id, 'dictionary-settings'],
    queryFn: async () => await getBackendJson(`languages/${id}/dictionary-settings`),
    staleTime: 0
  });
};

export function useLanguageOrthographySettings(id: string) {
  return useQuery<IOrthographySettings, ITitledError>({
    queryKey: ['languages', id, 'orth-settings'],
    queryFn: async () => await getBackendJson(`languages/${id}/orth-settings`)
  });
};

export function useLanguageWordClasses(id: string) {
  return useQuery<IWordClass[], ITitledError>({
    queryKey: ['languages', id, 'word-classes'],
    queryFn: async () => await getBackendJson(`languages/${id}/word-classes`)
  });
};

export function formatLanguageStatus(status: string) {
  if(status === 'living') {
    return "Living";
  } else if(status === 'dead') {
    return "Dead";
  } else if(status === 'proto') {
    return "Proto-Language";
  } else {
    return `Unknown (${status})`;
  }
};
