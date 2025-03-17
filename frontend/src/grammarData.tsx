import { Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';

import { IWordClass } from './wordData.tsx';
import {
  ITitledError, getBackendJson, sendBackendJson, sendBackendRequest
} from './utils.tsx';

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

export function getGrammarForms() {
  return useQuery<IGrammarForm[], ITitledError>({
    queryKey: ['grammar-forms'],
    queryFn: async () => await getBackendJson('grammar-forms')
  });
};

export function getGrammarTableById(id: string, enabled: boolean = true) {
  return useQuery<IGrammarTable, ITitledError>({
    queryKey: ['grammar-tables', id],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}`),
    enabled
  });
};

export function getGrammarTableClasses(id: string) {
  return useQuery<IWordClass[], ITitledError>({
    queryKey: ['grammar-tables', id, 'classes'],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}/classes`)
  });
};

export function getGrammarTableClassIds(id: string, enabled: boolean = true) {
  return useQuery<string[], ITitledError>({
    queryKey: ['grammar-tables', id, 'class-ids'],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}/class-ids`),
    enabled
  });
};

export function getGrammarTableFilledCells(id: string, enabled: boolean = true) {
  return useQuery<IGrammarTableCell[], ITitledError>({
    queryKey: ['grammar-tables', id, 'filled-cells'],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}/filled-cells`),
    enabled
  });
};

export interface IGrammarTableOverview {
  id: string;
  name: string;
  pos: string;
  rows: string[];
  columns: string[];
};

export function getGrammarTablesByLanguage(id: string) {
  return useQuery<IGrammarTableOverview[], ITitledError>({
    queryKey: ['languages', id, 'grammar-tables'],
    queryFn: async () => await getBackendJson(`languages/${id}/grammar-tables`)
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
