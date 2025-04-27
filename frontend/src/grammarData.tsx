import { Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  ITitledError, getBackendJson, sendBackendJson, sendBackendJsonForQuery,
  sendBackendRequest
} from './utils.tsx';
import { IWordClass } from './wordData.tsx';

export interface IGrammarForm {
  id: string;
  code: string;
  name: string;
};

export interface IGrammarTable {
  id: string;
  langId: string;
  name: string;
  pos: string;
  rows: string[];
  columns: string[];
  postRules: string;
  showIpa: boolean;
  invertClasses: boolean;
  notes: string;
};

export interface IGrammarTableCell {
  row: number;
  column: number;
  rules: string;
};

export interface IWordStem {
  id: string;
  pos: string;
  name: string;
  rules: string;
};

type AddGrammarTableArgument = Omit<IGrammarTable, 'id' | 'postRules'> & {
  classIds: string[];
};

export async function addGrammarTable(data: AddGrammarTableArgument) {
  return await sendBackendJson('grammar-tables', 'POST', data);
};

export async function deleteGrammarTable(id: string) {
  return await sendBackendRequest(`grammar-tables/${id}`, 'DELETE');
};

type EditGrammarTableArgument = Omit<IGrammarTable, 'id' | 'langId'> & {
  classIds: string[];
  cells: string[][];
};

export async function editGrammarTable(id: string, data: EditGrammarTableArgument) {
  return await sendBackendJson(`grammar-tables/${id}`, 'PUT', data);
};

export function useGrammarForms(enabled: boolean = true) {
  return useQuery<IGrammarForm[], ITitledError>({
    queryKey: ['grammar-forms'],
    queryFn: async () => await getBackendJson('grammar-forms'),
    enabled
  });
};

export function useGrammarTable(id: string, enabled: boolean = true) {
  return useQuery<IGrammarTable, ITitledError>({
    queryKey: ['grammar-tables', id],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}`),
    enabled
  });
};

export function useGrammarTableClasses(id: string) {
  return useQuery<IWordClass[], ITitledError>({
    queryKey: ['grammar-tables', id, 'classes'],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}/classes`)
  });
};

export function useGrammarTableClassIds(id: string, enabled: boolean = true) {
  return useQuery<string[], ITitledError>({
    queryKey: ['grammar-tables', id, 'class-ids'],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}/class-ids`),
    enabled
  });
};

export function useGrammarTableFilledCells(id: string, enabled: boolean = true) {
  return useQuery<IGrammarTableCell[], ITitledError>({
    queryKey: ['grammar-tables', id, 'filled-cells'],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}/filled-cells`),
    enabled
  });
};

export interface IGrammarTableIrregularFormCell {
  row: number;
  column: number;
  form: string;
};

export function useGrammarTableIrregularForms(tableId: string, wordId: string) {
  return useQuery<IGrammarTableIrregularFormCell[], ITitledError>({
    queryKey: ['grammar-tables', tableId, 'irregular-forms', wordId],
    queryFn: async () => {
      return await getBackendJson(`grammar-tables/${tableId}/irregular-forms/${wordId}`);
    }
  });
};

export interface IGrammarTableOverview {
  id: string;
  name: string;
  pos: string;
  rows: string[];
  columns: string[];
};

export function useLanguageGrammarTables(id: string) {
  return useQuery<IGrammarTableOverview[], ITitledError>({
    queryKey: ['languages', id, 'grammar-tables'],
    queryFn: async () => await getBackendJson(`languages/${id}/grammar-tables`)
  });
};

export function useLanguageWordStems(id: string) {
  return useQuery<IWordStem[], ITitledError>({
    queryKey: ['languages', id, 'word-stems'],
    queryFn: async () => await getBackendJson(`languages/${id}/word-stems`)
  });
};

export interface IGrammarTableIdAndName {
  id: string;
  name: string;
};

export function useWordGrammarTables(id: string) {
  return useQuery<IGrammarTableIdAndName[], ITitledError>({
    queryKey: ['words', id, 'grammar-tables'],
    queryFn: async () => await getBackendJson(`words/${id}/grammar-tables`)
  });
};

export type RunGrammarTableResultCell = {
  success: true;
  result: string;
  ipa?: string;
} | {
  success: false;
  message: string;
} | null;

interface IRandomGrammarTableWord {
  id: string;
  word: string;
  meaning: string;
  cells: RunGrammarTableResultCell[][];
}

export function useRandomGrammarTableWord(id: string) {
  return useQuery<IRandomGrammarTableWord | null, ITitledError>({
    queryKey: ['grammar-tables', id, 'random-word'],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}/random-word`)
  });
};

export function useRunGrammarTableOnWordQuery(tableId: string, wordId: string, enabled: boolean) {
  return useQuery<RunGrammarTableResultCell[][], ITitledError>({
    queryKey: ['grammar-tables', tableId, 'run-on-word', wordId],
    queryFn: async () => await sendBackendJsonForQuery(
      `grammar-tables/${tableId}/run-on-word`, 'POST', { wordId }
    ),
    staleTime: 0,
    enabled
  });
};

export function compareGrammarTables(t1: IGrammarTableOverview, t2: IGrammarTableOverview) {
  if(t1.pos !== t2.pos) {
    return t1.pos.localeCompare(t2.pos);
  } else if(t1.name !== t2.name) {
    return t1.name.localeCompare(t2.name);
  } else {
    return t1.id.localeCompare(t2.id);
  }
};

export function formatPeriodSeparatedGrammarForms(code: string, grammarForms: IGrammarForm[]) {
  return code.split(".").map((code, i) => {
    const period = i > 0 && ".";
    if(code === "Ø") {
      return <Fragment key={i}>{period}{code}</Fragment>
    }
    const posName = grammarForms.find(form => form.code === code)?.name ?? "unknown";
    const posNode = <abbr title={posName}>{code}</abbr>;
    return <Fragment key={i}>{period}{posNode}</Fragment>
  })
};
