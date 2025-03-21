import {
  formatPeriodSeparatedGrammarForms, IGrammarForm, IGrammarTable,
  RunGrammarTableResultCell
} from '../grammarData.tsx';

function WordGrammarTableCell({ cell }: { cell: RunGrammarTableResultCell }) {
  if(cell === null) {
    return <td className="empty-cell">&nbsp;</td>;
  } else if(cell.success) {
    return <td>{ cell.result }</td>;
  } else {
    return <td style={{ color: "#c00" }}>{ cell.message }</td>;
  }
}

interface IWordGrammarTable {
  table: IGrammarTable;
  grammarForms: IGrammarForm[];
  cells: RunGrammarTableResultCell[][];
}

export default function WordGrammarTable({ table, grammarForms, cells }: IWordGrammarTable) {
  return (
    <table className="grammar-table grammar-table-non-editable">
      <tbody>
        <tr>
          <th>&nbsp;</th>
          {
            table.columns.map((column, i) => (
              <th key={i}>
                { formatPeriodSeparatedGrammarForms(column, grammarForms) }
              </th>
            ))
          }
        </tr>
        {
          table.rows.map((row, i) => (
            <tr key={i}>
              <th>{ formatPeriodSeparatedGrammarForms(row, grammarForms) }</th>
              {
                table.columns.map((_, j) => (
                  <WordGrammarTableCell cell={ cells[i][j] } key={j} />
                ))
              }
            </tr>
          ))
        }
      </tbody>
    </table>
  );
};
