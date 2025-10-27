export interface IGrammarForm {
  id: string;
  code: string;
  name: string;
}

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
}

export interface IGrammarTableOverview {
  id: string;
  name: string;
  pos: string;
  rows: string[];
  columns: string[];
}

export interface IGrammarTableIdAndName {
  id: string;
  name: string;
}

export interface IGrammarTableCell {
  rules: string;
  stemId: string | null;
}

export type IGrammarTableCellWithPosition = IGrammarTableCell & {
  row: number;
  column: number;
};

export interface IGrammarTableIrregularFormCell {
  row: number;
  column: number;
  form: string;
}

export type RunGrammarTableResultCell = {
  success: true;
  result: string;
  ipa?: string;
} | {
  success: false;
  message: string;
} | null;

export interface IRandomGrammarTableWord {
  id: string;
  word: string;
  meaning: string;
  cells: RunGrammarTableResultCell[][];
}

export type IrregularWordStems = { [stemId: string]: string };

export interface IWordStem {
  id: string;
  pos: string;
  name: string;
  rules: string;
}

export type IWordStemNameOnly = Omit<IWordStem, 'pos' | 'rules'>;

export interface IWordIrregularForm {
  tableId: string;
  tableName: string;
  tablePos: string;
  rowName: string;
  columnName: string;
  form: string;
  wordId: string;
  word: string;
}
