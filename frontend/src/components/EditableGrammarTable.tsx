import { Dispatch, SetStateAction } from 'react';

type IEditableGrammarTable = {
  rows: string[];
  columns: string[];
  setRows: Dispatch<SetStateAction<string[]>>;
  setColumns: Dispatch<SetStateAction<string[]>>;
} & ({
  cells: string[][];
  setCells: Dispatch<SetStateAction<string[][]>>;
} | {
  cells?: never;
  setCells?: never;
});

export default function EditableGrammarTable(
  { rows, columns, cells, setRows, setColumns, setCells }: IEditableGrammarTable
) {
  return (
    <table className="grammar-table">
      <tbody>
        <tr>
          <th>&nbsp;</th>
          {
            columns.map((column, i) => (
              <th key={i}>
                <input
                  type="text"
                  value={column}
                  onChange={ e => setColumns(columns.with(i, e.target.value.toUpperCase())) }
                />
              </th>
            ))
          }
          <th>
            <span
              className="hover-light-grey"
              onClick={ () => {
                setColumns([ ...columns, "" ]);
                cells && setCells(cells.map(row => [ ...row, "" ]));
              } }
            >
              <span className="letter-button letter-button-small letter-button-t"></span>
            </span>
          </th>
        </tr>
        {
          rows.map((row, i) => (
            <tr key={i}>
              <th>
                <input
                  type="text"
                  value={row}
                  onChange={ e => setRows(rows.with(i, e.target.value.toUpperCase())) }
                />
              </th>
              {
                columns.map((_, j) => (
                  cells
                  ? <td key={j}>
                      <textarea
                        value={ cells[i][j] }
                        onChange={ e => setCells(
                          cells.with(i, cells[i].with(j, e.target.value))
                        ) }
                      />
                    </td>
                  : <td key={j} className="empty-cell">&nbsp;</td>
                ))
              }
              <th key={i}>
                {
                  rows.length > 1
                  ? <span
                      onClick={ () => {
                        setRows([
                          ...rows.slice(0, i), ...rows.slice(i + 1)
                        ]);
                        cells && setCells([
                          ...cells.slice(0, i), ...cells.slice(i + 1)
                        ]);
                      } }
                      className="hover-light-grey"
                    >
                      <span className="letter-button letter-button-small letter-button-x"></span>
                    </span>
                  : <>&nbsp;</>
                }
              </th>
            </tr>
          ))
        }
        <tr>
          <th>
            <span
              className="hover-light-grey"
              onClick={ () => {
                setRows([ ...rows, "" ]);
                cells && setCells([ ...cells, Array(columns.length).fill("")]);
              } }
            >
              <span className="letter-button letter-button-small letter-button-t"></span>
            </span>
          </th>
          {
            columns.map((_, i) => (
              <th key={i}>
                {
                  columns.length > 1
                  ? <span
                      onClick={ () => {
                        setColumns([
                          ...columns.slice(0, i), ...columns.slice(i + 1)
                        ]);
                        cells && setCells(cells.map(row => row.slice(0, -1)));
                      } }
                      className="hover-light-grey"
                    >
                      <span className="letter-button letter-button-small letter-button-x"></span>
                    </span>
                  : <>&nbsp;</>
                }
              </th>
            ))
          }
          <th>&nbsp;</th>
        </tr>
      </tbody>
    </table>
  );
};
