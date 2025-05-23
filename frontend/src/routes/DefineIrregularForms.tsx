import { Dispatch, SetStateAction, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import GrammarTableLink from '@/components/GrammarTableLink';

import {
  useGrammarForms,
  useGrammarTable,
  useGrammarTableIrregularForms
} from '@/hooks/grammar';
import { usePartsOfSpeech, useWord } from '@/hooks/words';

import {
  IGrammarForm,
  IGrammarTable,
  IGrammarTableIrregularFormCell
} from '@/types/grammar';
import { IPartOfSpeech, IWord } from '@/types/words';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

import { formatPeriodSeparatedGrammarForms } from '@/utils/grammar';

async function sendSaveIrregularFormsRequest(tableId: string, wordId: string, cells: string[][]) {
  const reqBody = { cells };
  return await sendBackendJson(
    `grammar-tables/${tableId}/irregular-forms/${wordId}`, 'PUT', reqBody
  );
}

function createCellMatrix(table: IGrammarTable, cells: IGrammarTableIrregularFormCell[]) {
  const result: string[][] = [];
  for(let i = 0; i < table.rows.length; ++i) {
    result.push(Array(table.columns.length).fill(""));
  }
  for(const cell of cells) {
    result[cell.row][cell.column] = cell.form;
  }
  return result;
}

interface IEditableIrregularFormsTable {
  rows: string[];
  columns: string[];
  cells: string[][];
  setCells: Dispatch<SetStateAction<string[][]>>;
  grammarForms: IGrammarForm[];
}

function EditableIrregularFormsTable(
  { rows, columns, cells, setCells, grammarForms }: IEditableIrregularFormsTable
) {
  return (
    <table className="grammar-table">
      <tbody>
        <tr>
          <th>&nbsp;</th>
          {columns.map((column, i) => (
            <th key={i}>
              {formatPeriodSeparatedGrammarForms(column, grammarForms)}
            </th>
          ))}
        </tr>
        {rows.map((row, i) => (
          <tr key={i}>
            <th>{formatPeriodSeparatedGrammarForms(row, grammarForms)}</th>
            {columns.map((_, j) => (
              <td key={j}>
                <input
                  type="text"
                  value={cells[i][j]}
                  onChange={e => setCells(
                    cells.with(i, cells[i].with(j, e.target.value))
                  )}
                  style={{ margin: "0 5px" }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface IDefineIrregularFormsInner {
  table: IGrammarTable;
  word: IWord;
  irregularFormCells: IGrammarTableIrregularFormCell[];
  grammarForms: IGrammarForm[];
  partsOfSpeech: IPartOfSpeech[];
}

function DefineIrregularFormsInner({
  table, word, irregularFormCells, grammarForms, partsOfSpeech
}: IDefineIrregularFormsInner) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cells, setCells] = useState(createCellMatrix(table, irregularFormCells));

  const [message, setMessage] = useState("");

  async function saveIrregularForms() {
    const result = await sendSaveIrregularFormsRequest(table.id, word.id, cells);
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }

    navigate('/word/' + word.id);
    queryClient.resetQueries({ queryKey: ['grammar-tables', table.id] });
  }

  return (
    <>
      <h2>Define Irregular Forms</h2>
      <p>
        Define irregular forms for the table{" "}
        <GrammarTableLink
          table={table}
          partsOfSpeech={partsOfSpeech}
        />.
      </p>
      {message && <p><b>{message}</b></p>}
      <p>
        Word:{" "}
        <Link to={'/word/' + word.id}>{word.word}</Link> ({word.meaning})
      </p>
      <EditableIrregularFormsTable
        rows={table.rows}
        columns={table.columns}
        cells={cells}
        setCells={setCells}
        grammarForms={grammarForms}
      />
      <form className="chronologue-form">
        <button type="button" onClick={saveIrregularForms}>
          Save changes
        </button>
        <button type="button" onClick={() => navigate(-1)}>
          Back
        </button>
      </form>
    </>
  );
}

export default function DefineIrregularForms() {
  const { id: tableId } = useParams();

  const [searchParams] = useSearchParams();
  const wordId = searchParams.get('word');

  if(!tableId) {
    throw new Error("No table ID was provided");
  } else if(!wordId) {
    throw new Error("No word ID was provided");
  }

  const tableResponse = useGrammarTable(tableId);
  const wordResponse = useWord(wordId);
  const irregularFormsResponse = useGrammarTableIrregularForms(tableId, wordId);
  const grammarFormsResponse = useGrammarForms();
  const partsOfSpeechResponse = usePartsOfSpeech();

  useSetPageTitle("Define Irregular Forms");

  if(tableResponse.status !== 'success') {
    return renderDatalessQueryResult(tableResponse);
  }

  if(wordResponse.status !== 'success') {
    return renderDatalessQueryResult(wordResponse);
  }

  if(irregularFormsResponse.status !== 'success') {
    return renderDatalessQueryResult(irregularFormsResponse);
  }

  if(grammarFormsResponse.status !== 'success') {
    return renderDatalessQueryResult(grammarFormsResponse);
  }

  if(partsOfSpeechResponse.status !== 'success') {
    return renderDatalessQueryResult(partsOfSpeechResponse);
  }

  return (
    <DefineIrregularFormsInner
      table={tableResponse.data}
      word={wordResponse.data}
      irregularFormCells={irregularFormsResponse.data}
      grammarForms={grammarFormsResponse.data}
      partsOfSpeech={partsOfSpeechResponse.data}
    />
  );
};
