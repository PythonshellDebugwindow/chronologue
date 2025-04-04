import { useQuery } from '@tanstack/react-query';

import DisplayDate from './components/DisplayDate.tsx';

import {
  getBackendJson, parseRecordDates, parseSingleRecordDates, sendBackendJson,
  sendBackendRequest, ITitledError
} from './utils.tsx';

export interface IWord {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  pos: string;
  etymology: string;
  notes: string;
  langId: string;
  created: Date;
  updated: Date | null;
};

export interface IPartOfSpeech {
  code: string;
  name: string;
};

export interface IWordClass {
  id: string;
  pos: string;
  code: string;
  name: string;
};

export type IWordClassNoPOS = Omit<IWordClass, 'pos'>;

type AddWordArgument = Omit<IWord, 'id' | 'parents' | 'created' | 'updated'> & {
  classIds: string[];
};

export async function addWord(data: AddWordArgument) {
  return await sendBackendJson('words', 'POST', data);
};

export async function deleteWord(id: string) {
  return await sendBackendRequest(`words/${id}`, 'DELETE');
};

export async function editWord(id: string, data: AddWordArgument) {
  return await sendBackendJson(`words/${id}`, 'PUT', data);
};

export function usePartsOfSpeech() {
  return useQuery<IPartOfSpeech[], ITitledError>({
    queryKey: ['parts-of-speech'],
    queryFn: async () => await getBackendJson(`parts-of-speech`)
  });
};

export function useWord(id: string, enabled: boolean = true) {
  return useQuery<IWord, ITitledError>({
    queryKey: ['words', id],
    queryFn: async () => parseSingleRecordDates(await getBackendJson(`words/${id}`)),
    enabled
  });
};

export function useWordClassIds(wordId: string, enabled: boolean = true) {
  return useQuery<string[], ITitledError>({
    queryKey: ['words', wordId, 'class-ids'],
    queryFn: async () => await getBackendJson(`words/${wordId}/class-ids`),
    enabled
  });
};

export function useWordClasses(wordId: string) {
  return useQuery<IWordClassNoPOS[], ITitledError>({
    queryKey: ['words', wordId, 'classes'],
    queryFn: async () => await getBackendJson(`words/${wordId}/classes`)
  });
};

export function useLanguageWordCount(id: string) {
  return useQuery<number, ITitledError>({
    queryKey: ['languages', id, 'word-count'],
    queryFn: async () => await getBackendJson(`languages/${id}/word-count`)
  });
};

export function useLanguageWords(id: string) {
  return useQuery<IWord[], ITitledError>({
    queryKey: ['languages', id, 'words'],
    queryFn: async () => parseRecordDates(await getBackendJson(`languages/${id}/words`))
  });
};

export function userFacingFieldName(field: string) {
  if(field === 'pos') {
    return <abbr title="part of speech">POS</abbr>;
  } else if(field === 'ipa') {
    return "IPA";
  } else {
    return field[0].toUpperCase() + field.substring(1);
  }
};

export function formatDictionaryFieldValue(word: IWord, field: keyof IWord) {
  const value = word[field];
  if(field === 'ipa') {
    return "[" + value + "]";
  } else if(value instanceof Date) {
    return <DisplayDate date={ value as Date } />;
  } else {
    return value;
  }
};

export function formatPosFieldValue(posCode: string, partsOfSpeech: IPartOfSpeech[]) {
  const pos = partsOfSpeech.find(pos => pos.code === posCode);
  return pos ? pos.name : `unknown (${posCode})`;
};

export function formatWordClasses(classes: IWordClassNoPOS[]) {
  return (
    <ul style={{ listStyle: "none", margin: "0", padding: "0" }}>
      {
        classes.map(cls => (
          <li key={cls.code}>
            { `[${cls.code}] ${cls.name}` }
          </li>
        ))
      }
    </ul>
  );
};
