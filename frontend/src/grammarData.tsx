import { useQuery } from '@tanstack/react-query';

import { IWordClass } from './wordData.tsx';
import { ITitledError, getBackendJson, sendBackendJson } from './utils.tsx';

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
  preRules: string;
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

type AddGrammarTableArgument = Omit<IGrammarTable, 'id' | 'preRules' | 'postRules'> & {
  classIds: string[];
};

export async function addGrammarTable(data: AddGrammarTableArgument) {
  return await sendBackendJson('grammar-tables', 'POST', data);
};

type EditGrammarTableArgument = Omit<IGrammarTable, 'id' | 'langId'> & {
  classIds: string[];
  cells: string[][];
};

export async function editGrammarTable(id: string, data: EditGrammarTableArgument) {
  return await sendBackendJson(`grammar-tables/${id}`, 'PUT', data);
};

export function getGrammarForms() {
  return useQuery<IGrammarForm[], ITitledError>({
    queryKey: ['grammar-forms'],
    queryFn: async () => await getBackendJson('grammar-forms')
  });
};

export function getGrammarTableById(id: string) {
  return useQuery<IGrammarTable, ITitledError>({
    queryKey: ['grammar-tables', id],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}`)
  });
};

export function getGrammarTableClasses(id: string) {
  return useQuery<IWordClass[], ITitledError>({
    queryKey: ['grammar-tables', id, 'classes'],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}/classes`)
  });
};

export function getGrammarTableClassIds(id: string) {
  return useQuery<string[], ITitledError>({
    queryKey: ['grammar-tables', id, 'class-ids'],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}/class-ids`)
  });
};

export function getGrammarTableFilledCells(id: string) {
  return useQuery<IGrammarTableCell[], ITitledError>({
    queryKey: ['grammar-tables', id, 'filled-cells'],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}/filled-cells`)
  });
};
