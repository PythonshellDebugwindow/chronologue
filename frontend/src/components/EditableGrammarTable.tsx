import { Dispatch, SetStateAction } from 'react';
import { IGrammarTableCell, useLanguageWordStemsByPOS } from '../grammarData';

interface IStemSelect {
  langId: string;
  pos: string;
  stemId: string | null;
  setStemId: (stemId: string | null) => void;
}

function StemSelect({ langId, pos, stemId, setStemId }: IStemSelect) {
  const stemsQuery = useLanguageWordStemsByPOS(langId, pos);

  if(stemsQuery.status === 'pending') {
    return <p className="select-stem">Loading...</p>;
  } else if(stemsQuery.status === 'error') {
    return <p className="select-stem">Stem error: {stemsQuery.error.message}</p>;
  }

  return (
    <p className="select-stem">
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
  langId: string;
  pos: string;
  rows: string[];
  columns: string[];
  setRows: Dispatch<SetStateAction<string[]>>;
  setColumns: Dispatch<SetStateAction<string[]>>;
} & ({
  cells: IGrammarTableCell[][];
  setCells: Dispatch<SetStateAction<IGrammarTableCell[][]>>;
} | {
  cells?: never;
  setCells?: never;
});

export default function EditableGrammarTable(
  { langId, pos, rows, columns, cells, setRows, setColumns, setCells }: IEditableGrammarTable
) {
  return (
    <table className={"grammar-table" + (cells ? " grammar-table-padded" : "")}>
      <tbody>
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
            <span
              className="hover-light-grey"
              onClick={() => {
                setColumns([...columns, ""]);
                if(cells) {
                  setCells(cells.map(row => [...row, { rules: "", stemId: null }]));
                }
              }}
            >
              <span className="letter-button letter-button-small letter-button-t" />
            </span>
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
                : <td key={j} className="empty-cell">&nbsp;</td>
            ))}
            <th key={i}>
              {
                rows.length > 1
                  ? <span
                      onClick={() => {
                        setRows([
                          ...rows.slice(0, i), ...rows.slice(i + 1)
                        ]);
                        if(cells) {
                          setCells([...cells.slice(0, i), ...cells.slice(i + 1)]);
                        }
                      }}
                      className="hover-light-grey"
                    >
                      <span className="letter-button letter-button-small letter-button-x" />
                    </span>
                  : <>&nbsp;</>
              }
            </th>
          </tr>
        ))}
        <tr>
          <th>
            <span
              className="hover-light-grey"
              onClick={() => {
                setRows([...rows, ""]);
                if(cells) {
                  setCells([...cells, Array(columns.length).fill("")]);
                }
              }}
            >
              <span className="letter-button letter-button-small letter-button-t" />
            </span>
          </th>
          {columns.map((_, i) => (
            <th key={i}>
              {
                columns.length > 1
                  ? <span
                      onClick={() => {
                        setColumns([
                          ...columns.slice(0, i), ...columns.slice(i + 1)
                        ]);
                        if(cells) {
                          setCells(cells.map(row => row.slice(0, -1)));
                        }
                      }}
                      className="hover-light-grey"
                    >
                      <span className="letter-button letter-button-small letter-button-x" />
                    </span>
                  : <>&nbsp;</>
              }
            </th>
          ))}
          <th>&nbsp;</th>
        </tr>
      </tbody>
    </table>
  );
};
