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

export function getPartsOfSpeech() {
  return useQuery<IPartOfSpeech[], ITitledError>({
    queryKey: ['parts-of-speech'],
    queryFn: async () => await getBackendJson(`parts-of-speech`)
  });
};

export function getWordById(id: string, enabled: boolean = true) {
  return useQuery<IWord, ITitledError>({
    queryKey: ['words', id],
    queryFn: async () => parseSingleRecordDates(await getBackendJson(`words/${id}`)),
    enabled
  });
};

export function getWordClassIdsByWord(id: string, enabled: boolean = true) {
  return useQuery<string[], ITitledError>({
    queryKey: ['words', id, 'class-ids'],
    queryFn: async () => await getBackendJson(`words/${id}/class-ids`),
    enabled
  });
};

export function getWordClassesByWord(id: string) {
  return useQuery<IWordClassNoPOS[], ITitledError>({
    queryKey: ['words', id, 'classes'],
    queryFn: async () => await getBackendJson(`words/${id}/classes`)
  });
};

export function getWordsByLanguage(id: string) {
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
