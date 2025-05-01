import { useQuery } from '@tanstack/react-query';

import DisplayDate from './components/DisplayDate.tsx';
import LanguageLink from './components/LanguageLink.tsx';
import WordLink from './components/WordLink.tsx';

import { IrregularWordStems } from './grammarData.tsx';
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

type IAddWordArgument = Omit<IWord, 'id' | 'created' | 'updated'> & {
  classIds: string[];
  irregularStems: IrregularWordStems | null;
};

export async function addWord(data: IAddWordArgument) {
  return await sendBackendJson('words', 'POST', data);
};

export async function deleteWord(id: string) {
  return await sendBackendRequest(`words/${id}`, 'DELETE');
};

export async function editWord(id: string, data: IAddWordArgument) {
  return await sendBackendJson(`words/${id}`, 'PUT', data);
};

export async function purgeDictionary(id: string) {
  return await sendBackendRequest(`languages/${id}/purge-dictionary`, 'DELETE');
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
    return <DisplayDate date={value} />;
  } else {
    return value;
  }
};

export function formatPosAbbr(code: string, partsOfSpeech: IPartOfSpeech[]) {
  const pos = partsOfSpeech.find(pos => pos.code === code);
  const posName = pos ? pos.name : "unknown code";
  return <abbr title={posName}>{code}</abbr>;
};

export function formatPosFieldValue(posCode: string, partsOfSpeech: IPartOfSpeech[]) {
  const pos = partsOfSpeech.find(pos => pos.code === posCode);
  return pos ? pos.name : `unknown (${posCode})`;
};

export function formatWordClasses(classes: IWordClassNoPOS[]) {
  return (
    <ul style={{ listStyle: "none", margin: "0", padding: "0" }}>
      {classes.map(cls => (
        <li key={cls.code}>
          [{cls.code}] {cls.name}
        </li>
      ))}
    </ul>
  );
};

export function formatWordEtymology(etymology: string) {
  const result = [];
  let i = etymology.indexOf("@");
  let oldIndex = 0;
  for(; i > -1; i = etymology.indexOf("@", i + 1)) {
    result.push(etymology.substring(oldIndex, i));

    if(etymology[i + 1] === "@") {
      result.push("@");
      ++i;
    } else if(/^\([0-9a-f]{32}\)/.test(etymology.substring(i + 2))) {
      const linkType = etymology[i + 1];
      const id = etymology.substring(i + 3, i + 3 + 32);
      switch(linkType) {
        case "d":
        case "w":
          result.push(<WordLink id={id} key={result.length} />);
          i += 3 + 32;
          break;
        case "l":
          result.push(<LanguageLink id={id} key={result.length} />);
          i += 3 + 32;
          break;
        default:
          result.push("@");
      }
    } else {
      result.push("@");
    }

    oldIndex = i + 1;
  }
  result.push(etymology.substring(oldIndex));
  return result;
};
