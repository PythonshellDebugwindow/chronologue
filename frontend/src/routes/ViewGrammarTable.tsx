import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import LanguageLink from '../components/LanguageLink.tsx';
import WordGrammarTable from '../components/WordGrammarTable.tsx';

import {
  formatPeriodSeparatedGrammarForms, getGrammarForms, getGrammarTableById,
  getGrammarTableClasses, getGrammarTableFilledCells,
  useGetRandomWordForGrammarTableQuery, IGrammarForm, IGrammarTable, IGrammarTableCell
} from '../grammarData.tsx';
import { useSetPageTitle } from '../utils.tsx';
import {
  formatPosFieldValue, formatWordClasses, getPartsOfSpeech,
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
                  filledCells.some(c => i === c.row && j === c.column)
                  ? <td key={j}>&nbsp;</td>
                  : <td key={j} className="empty-cell">&nbsp;</td>
                ))
              }
            </tr>
          ))
        }
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
  const result = useGetRandomWordForGrammarTableQuery(table.id);
  if(result.status === 'pending') {
    return <p>Loading random word...</p>;
  } else if(result.status === 'error') {
    return <p>Could not load random word: { result.error.message }</p>;
  }

  if(result.data) {
    return (
      <>
        <p style={{ margin: "0" }}>
          Random word:{" "}
          <Link to={ '/word/' + result.data.id }>{ result.data.word }</Link>{" "}
          ({ result.data.meaning })
        </p>
        <div
          className="word-grammar-table-container"
          style={{ display: "inline-block", textAlign: "left" }}
        >
          <small>
            <Link to={ '/edit-word/' + result.data.id }>
              [edit word]
            </Link>
          </small>
          <WordGrammarTable
            table={table}
            grammarForms={grammarForms}
            cells={ result.data.cells }
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
  const [ params ] = useSearchParams();
  const queryClient = useQueryClient();

  function resetRandomWordQuery() {
    queryClient.resetQueries({ queryKey: ['grammar-tables', table.id, 'random-word'] });
  }

  return (
    <>
      <h2>View Grammar Table{ table.name && `: ${table.name}` }</h2>
      <table className="info-table" style={{ marginBottom: "1em" }}>
        <tbody>
          <tr>
            <th>Language:</th>
            <td>
              <LanguageLink id={ table.langId } />
            </td>
          </tr>
          <tr>
            <th>{ userFacingFieldName('pos') }:</th>
            <td>{ formatPosFieldValue(table.pos, partsOfSpeech) }</td>
          </tr>
          {
            classes.length > 0 && (
              <tr>
                <th>Classes:</th>
                <td>
                  { formatWordClasses(classes) }
                  { table.invertClasses && "(exclusive)" }
                </td>
              </tr>
            )
          }
        </tbody>
      </table>
      <p>
        <Link to={ '?random' } onClick={resetRandomWordQuery}>Random example</Link>
      </p>
      {
        params.has('random') ? (
          <DisplayRandomTableWord
            table={table}
            filledCells={filledCells}
            grammarForms={grammarForms}
          />
        ) : (
          <GrammarTableDisplay
            table={table}
            filledCells={filledCells}
            grammarForms={grammarForms}
          />
        )
      }
      {
        table.notes && (
          <p
            className="user-notes-paragraph"
            style={{ marginTop: "1em" }}
          >
            { table.notes }
          </p>
        )
      }
      <p><Link to={ '/edit-grammar-table/' + table.id }>Edit table</Link></p>
      <p><Link to={ `/add-grammar-table/${table.langId}?copy=${table.id}` }>Copy table</Link></p>
      <p><Link to={ '/delete-grammar-table/' + table.id }>Delete table</Link></p>
    </>
  );
}

export default function ViewGrammarTable() {
  const { id } = useParams();
  if(!id) {
    throw new Error("No table ID was provided");
  }

  const tableResponse = getGrammarTableById(id);
  const classesResponse = getGrammarTableClasses(id);
  const filledCellsResponse = getGrammarTableFilledCells(id);
  const grammarFormsResponse = getGrammarForms();
  const partsOfSpeechResponse = getPartsOfSpeech();
  
  useSetPageTitle("View Grammar Table");

  if(tableResponse.status === 'pending') {
    return <p>Loading table summary...</p>;
  } else if(tableResponse.status === 'error') {
    return (
      <>
        <h2>{ tableResponse.error.title }</h2>
        <p>{ tableResponse.error.message }</p>
      </>
    );
  }
  
  if(classesResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(classesResponse.status === 'error') {
    return (
      <p>{ classesResponse.error.message }</p>
    );
  }
  
  if(filledCellsResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(filledCellsResponse.status === 'error') {
    return (
      <p>{ filledCellsResponse.error.message }</p>
    );
  }
  
  if(grammarFormsResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(grammarFormsResponse.status === 'error') {
    return (
      <p>{ grammarFormsResponse.error.message }</p>
    );
  }
  
  if(partsOfSpeechResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(partsOfSpeechResponse.status === 'error') {
    return (
      <p>{ partsOfSpeechResponse.error.message }</p>
    );
  }
  
  return (
    <ViewGrammarTableInner
      table={ tableResponse.data }
      classes={ classesResponse.data }
      filledCells={ filledCellsResponse.data }
      grammarForms={ grammarFormsResponse.data }
      partsOfSpeech={ partsOfSpeechResponse.data }
    />
  );
};
