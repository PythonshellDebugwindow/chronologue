import { Dispatch, SetStateAction } from 'react';

import { EmptyGrammarTableCell, GrammarTable } from '../GrammarTable';
import { LetterButtonPlus, LetterButtonX } from '../LetterButtons';

import { useLanguageWordStemsByPOS } from '@/hooks/grammar';

import { IGrammarTableCell } from '@/types/grammar';

import styles from './EditableGrammarTable.module.css';

interface IStemSelect {
  langId: string;
  pos: string;
  stemId: string | null;
  setStemId: (stemId: string | null) => void;
}

function StemSelect({ langId, pos, stemId, setStemId }: IStemSelect) {
  const stemsQuery = useLanguageWordStemsByPOS(langId, pos);

  if(stemsQuery.status === 'pending') {
    return <p className={styles.selectStem}>Loading...</p>;
  } else if(stemsQuery.status === 'error') {
    return <p className={styles.selectStem}>Stem error: {stemsQuery.error.message}</p>;
  }

  return (
    <p className={styles.selectStem}>
      <label>
        Stem:{" "}
        <select
          value={stemId ?? ""}
          onChange={e => setStemId(e.target.value || null)}
        >
          <option value="">---</option>
          {stemsQuery.data.map(stem => (
            <option value={stem.id} key={stem.id}>{stem.name}</option>
          ))}
        </select>
      </label>
    </p>
  );
}

type IEditableGrammarTable = {
  rows: string[];
  columns: string[];
  setRows: Dispatch<SetStateAction<string[]>>;
  setColumns: Dispatch<SetStateAction<string[]>>;
} & ({
  langId: string;
  pos: string;
  cells: IGrammarTableCell[][];
  setCells: Dispatch<SetStateAction<IGrammarTableCell[][]>>;
} | {
  langId?: never;
  pos?: never;
  cells?: never;
  setCells?: never;
});

export default function EditableGrammarTable(
  { langId, pos, rows, columns, cells, setRows, setColumns, setCells }: IEditableGrammarTable
) {
  function addRow() {
    setRows([...rows, ""]);
    if(cells) {
      setCells([...cells, Array(columns.length).fill({ rules: "", stemId: null })]);
    }
  }

  function addColumn() {
    setColumns([...columns, ""]);
    if(cells) {
      setCells(cells.map(row => [...row, { rules: "", stemId: null }]));
    }
  }

  function removeRow(i: number) {
    setRows([...rows.slice(0, i), ...rows.slice(i + 1)]);
    if(cells) {
      setCells([...cells.slice(0, i), ...cells.slice(i + 1)]);
    }
  }

  function removeColumn(i: number) {
    setColumns([...columns.slice(0, i), ...columns.slice(i + 1)]);
    if(cells) {
      setCells(cells.map(row => [...row.slice(0, i), ...row.slice(i + 1)]));
    }
  }

  return (
    <GrammarTable padded={cells !== undefined}>
      <tr>
        <th>&nbsp;</th>
        {columns.map((column, i) => (
          <th key={i}>
            <input
              type="text"
              value={column}
              onChange={e => setColumns(columns.with(i, e.target.value.toUpperCase()))}
            />
          </th>
        ))}
        <th>
          <LetterButtonPlus onClick={addColumn} />
        </th>
      </tr>
      {rows.map((row, i) => (
        <tr key={i}>
          <th>
            <input
              type="text"
              value={row}
              onChange={e => setRows(rows.with(i, e.target.value.toUpperCase()))}
            />
          </th>
          {columns.map((_, j) => (
            cells
              ? <td key={j}>
                  <StemSelect
                    langId={langId}
                    pos={pos}
                    stemId={cells[i][j].stemId}
                    setStemId={stemId => {
                      const newCell = { ...cells[i][j], stemId };
                      setCells(cells.with(i, cells[i].with(j, newCell)));
                    }}
                  />
                  <textarea
                    value={cells[i][j].rules}
                    onChange={e => {
                      const newCell = { ...cells[i][j], rules: e.target.value };
                      setCells(cells.with(i, cells[i].with(j, newCell)));
                    }}
                  />
                </td>
              : <EmptyGrammarTableCell key={j} />
          ))}
          <th key={i}>
            {
              rows.length > 1
                ? <LetterButtonX onClick={() => removeRow(i)} />
                : <>&nbsp;</>
            }
          </th>
        </tr>
      ))}
      <tr>
        <th>
          <LetterButtonPlus onClick={addRow} />
        </th>
        {columns.map((_, i) => (
          <th key={i}>
            {
              columns.length > 1
                ? <LetterButtonX onClick={() => removeColumn(i)} />
                : <>&nbsp;</>
            }
          </th>
        ))}
        <th>&nbsp;</th>
      </tr>
    </GrammarTable>
  );
}
