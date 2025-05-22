import { useQuery } from '@tanstack/react-query';

import {
  IGrammarForm,
  IGrammarTable,
  IGrammarTableIdAndName,
  IGrammarTableIrregularFormCell,
  IGrammarTableOverview,
  IGrammarTableCellWithPosition,
  IRandomGrammarTableWord,
  IrregularWordStems,
  IWordStem,
  IWordStemNameOnly,
  RunGrammarTableResultCell
} from '@/types/grammar';
import { ITitledError } from '@/types/titledError';
import { IWordClass } from '@/types/words';

import { getBackendJson, sendBackendJsonForQuery } from '@/utils/global/queries';

export function useGrammarForms(enabled: boolean = true) {
  return useQuery<IGrammarForm[], ITitledError>({
    queryKey: ['grammar-forms'],
    queryFn: async () => await getBackendJson('grammar-forms'),
    enabled
  });
}

export function useGrammarTable(id: string, enabled: boolean = true) {
  return useQuery<IGrammarTable, ITitledError>({
    queryKey: ['grammar-tables', id],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}`),
    enabled
  });
}

export function useGrammarTableClasses(id: string) {
  return useQuery<IWordClass[], ITitledError>({
    queryKey: ['grammar-tables', id, 'classes'],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}/classes`)
  });
}

export function useGrammarTableClassIds(id: string, enabled: boolean = true) {
  return useQuery<string[], ITitledError>({
    queryKey: ['grammar-tables', id, 'class-ids'],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}/class-ids`),
    enabled
  });
}

export function useGrammarTableFilledCells(id: string, enabled: boolean = true) {
  return useQuery<IGrammarTableCellWithPosition[], ITitledError>({
    queryKey: ['grammar-tables', id, 'filled-cells'],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}/filled-cells`),
    enabled
  });
}

export function useGrammarTableIrregularForms(tableId: string, wordId: string) {
  return useQuery<IGrammarTableIrregularFormCell[], ITitledError>({
    queryKey: ['grammar-tables', tableId, 'irregular-forms', wordId],
    queryFn: async () => {
      return await getBackendJson(`grammar-tables/${tableId}/irregular-forms/${wordId}`);
    }
  });
}

export function useLanguageGrammarTables(id: string) {
  return useQuery<IGrammarTableOverview[], ITitledError>({
    queryKey: ['languages', id, 'grammar-tables'],
    queryFn: async () => await getBackendJson(`languages/${id}/grammar-tables`)
  });
}

export function useLanguageWordStems(id: string) {
  return useQuery<IWordStem[], ITitledError>({
    queryKey: ['languages', id, 'word-stems'],
    queryFn: async () => await getBackendJson(`languages/${id}/word-stems`)
  });
}

export function useLanguageWordStemsByPOS(id: string, pos: string) {
  return useQuery<IWordStemNameOnly[], ITitledError>({
    queryKey: ['languages', id, 'pos-word-stems', pos],
    queryFn: async () => await getBackendJson(`languages/${id}/pos-word-stems/${pos}`)
  });
}

export function useIrregularWordStems(wordId: string) {
  return useQuery<IrregularWordStems, ITitledError>({
    queryKey: ['words', wordId, 'irregular-stems'],
    queryFn: async () => await getBackendJson(`words/${wordId}/irregular-stems`)
  });
}

export function useWordGrammarTables(id: string) {
  return useQuery<IGrammarTableIdAndName[], ITitledError>({
    queryKey: ['words', id, 'grammar-tables'],
    queryFn: async () => await getBackendJson(`words/${id}/grammar-tables`)
  });
}

export function useRandomGrammarTableWord(id: string) {
  return useQuery<IRandomGrammarTableWord | null, ITitledError>({
    queryKey: ['grammar-tables', id, 'random-word'],
    queryFn: async () => await getBackendJson(`grammar-tables/${id}/random-word`)
  });
}

export function useRunGrammarTableOnWordQuery(tableId: string, wordId: string, enabled: boolean) {
  return useQuery<RunGrammarTableResultCell[][], ITitledError>({
    queryKey: ['grammar-tables', tableId, 'run-on-word', wordId],
    queryFn: async () => await sendBackendJsonForQuery(
      `grammar-tables/${tableId}/run-on-word`, 'POST', { wordId }
    ),
    staleTime: 0,
    enabled
  });
}
