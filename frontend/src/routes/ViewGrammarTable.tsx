import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import LanguageLink from '../components/LanguageLink.tsx';
import WordGrammarTable from '../components/WordGrammarTable.tsx';

import {
  formatPeriodSeparatedGrammarForms, useGrammarForms, useGrammarTable,
  useGrammarTableClasses, useGrammarTableFilledCells,
  useRandomGrammarTableWord, IGrammarForm, IGrammarTable, IGrammarTableCell
} from '../grammarData.tsx';
import { renderDatalessQueryResult, useSetPageTitle } from '../utils.tsx';
import {
  formatPosFieldValue, formatWordClasses, usePartsOfSpeech,
  userFacingFieldName, IPartOfSpeech, IWordClassNoPOS
} from '../wordData.tsx';

interface IGrammarTableDisplay {
  table: IGrammarTable;
  filledCells: IGrammarTableCell[];
  grammarForms: IGrammarForm[];
}

function GrammarTableDisplay({ table, filledCells, grammarForms }: IGrammarTableDisplay) {
  return (
    <table className="grammar-table grammar-table-non-editable">
      <tbody>
        <tr>
          <th>&nbsp;</th>
          {table.columns.map((column, i) => (
            <th key={i}>
              {formatPeriodSeparatedGrammarForms(column, grammarForms)}
            </th>
          ))}
        </tr>
        {table.rows.map((row, i) => (
          <tr key={i}>
            <th>{formatPeriodSeparatedGrammarForms(row, grammarForms)}</th>
            {table.columns.map((_, j) => (
              filledCells.some(c => i === c.row && j === c.column)
                ? <td key={j}>&nbsp;</td>
                : <td key={j} className="empty-cell">&nbsp;</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface IDisplayRandomTableWord {
  table: IGrammarTable;
  filledCells: IGrammarTableCell[];
  grammarForms: IGrammarForm[];
}

function DisplayRandomTableWord({ table, filledCells, grammarForms }: IDisplayRandomTableWord) {
  const result = useRandomGrammarTableWord(table.id);

  if(result.status === 'pending') {
    return <p>Loading random word...</p>;
  } else if(result.status === 'error') {
    return <p>Could not load random word: {result.error.message}</p>;
  }

  if(result.data) {
    return (
      <>
        <p style={{ marginBottom: "0.4em" }}>
          Random word:{" "}
          <Link to={'/word/' + result.data.id}>{result.data.word}</Link>{" "}
          ({result.data.meaning})
        </p>
        <div
          className="word-grammar-table-container"
          style={{ display: "inline-block", textAlign: "left" }}
        >
          <small>
            <Link to={'/edit-word/' + result.data.id}>
              [edit word]
            </Link>
            {" "}
            <Link to={`/irregular-forms/${table.id}?word=${result.data.id}`}>
              [irregular forms]
            </Link>
          </small>
          <WordGrammarTable
            table={table}
            grammarForms={grammarForms}
            cells={result.data.cells}
          />
        </div>
      </>
    );
  } else {
    return (
      <>
        <p>This table does not apply to any words.</p>
        <GrammarTableDisplay
          table={table}
          filledCells={filledCells}
          grammarForms={grammarForms}
        />
      </>
    );
  }
}

interface IViewGrammarTableInner {
  table: IGrammarTable;
  classes: IWordClassNoPOS[];
  filledCells: IGrammarTableCell[];
  grammarForms: IGrammarForm[];
  partsOfSpeech: IPartOfSpeech[];
}

function ViewGrammarTableInner(
  { table, classes, filledCells, grammarForms, partsOfSpeech }: IViewGrammarTableInner
) {
  const [params] = useSearchParams();
  const queryClient = useQueryClient();

  function resetRandomWordQuery() {
    queryClient.resetQueries({ queryKey: ['grammar-tables', table.id, 'random-word'] });
  }

  return (
    <>
      <h2>View Grammar Table{table.name && `: ${table.name}`}</h2>
      <table className="info-table" style={{ marginBottom: "1em" }}>
        <tbody>
          <tr>
            <th>Language:</th>
            <td>
              <LanguageLink id={table.langId} />
            </td>
          </tr>
          <tr>
            <th>{userFacingFieldName('pos')}:</th>
            <td>{formatPosFieldValue(table.pos, partsOfSpeech)}</td>
          </tr>
          {classes.length > 0 && (
            <tr>
              <th>Classes:</th>
              <td>
                {formatWordClasses(classes)}
                {table.invertClasses && "(exclusive)"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p>
        <Link to="?random" onClick={resetRandomWordQuery}>Random example</Link>
      </p>
      {
        params.has('random')
          ? <DisplayRandomTableWord
              table={table}
              filledCells={filledCells}
              grammarForms={grammarForms}
            />
          : <GrammarTableDisplay
              table={table}
              filledCells={filledCells}
              grammarForms={grammarForms}
            />
      }
      {table.notes && (
        <div>
          <p
            className="user-notes-paragraph"
            style={{ marginTop: "1em" }}
          >
            {table.notes}
          </p>
        </div>
      )}
      <p><Link to={'/edit-grammar-table/' + table.id}>Edit table</Link></p>
      <p><Link to={`/add-grammar-table/${table.langId}?copy=${table.id}`}>Copy table</Link></p>
      <p><Link to={'/delete-grammar-table/' + table.id}>Delete table</Link></p>
    </>
  );
}

export default function ViewGrammarTable() {
  const { id } = useParams();
  if(!id) {
    throw new Error("No table ID was provided");
  }

  const tableResponse = useGrammarTable(id);
  const classesResponse = useGrammarTableClasses(id);
  const filledCellsResponse = useGrammarTableFilledCells(id);
  const grammarFormsResponse = useGrammarForms();
  const partsOfSpeechResponse = usePartsOfSpeech();

  useSetPageTitle("View Grammar Table");

  if(tableResponse.status !== 'success') {
    return renderDatalessQueryResult(tableResponse);
  }

  if(classesResponse.status !== 'success') {
    return renderDatalessQueryResult(classesResponse);
  }

  if(filledCellsResponse.status !== 'success') {
    return renderDatalessQueryResult(filledCellsResponse);
  }

  if(grammarFormsResponse.status !== 'success') {
    return renderDatalessQueryResult(grammarFormsResponse);
  }

  if(partsOfSpeechResponse.status !== 'success') {
    return renderDatalessQueryResult(partsOfSpeechResponse);
  }

  return (
    <ViewGrammarTableInner
      table={tableResponse.data}
      classes={classesResponse.data}
      filledCells={filledCellsResponse.data}
      grammarForms={grammarFormsResponse.data}
      partsOfSpeech={partsOfSpeechResponse.data}
    />
  );
};
