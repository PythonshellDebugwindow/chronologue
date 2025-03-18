import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import LanguageLink from '../components/LanguageLink.tsx';

import {
  formatPeriodSeparatedGrammarForms, getGrammarForms, getGrammarTableById,
  getGrammarTablesForWord, useRunGrammarTableOnWordQuery,
  IGrammarForm, IGrammarTable, IGrammarTableIdAndName, RunGrammarTableResultCell
} from '../grammarData.tsx';
import {
  formatDictionaryFieldValue, formatPosFieldValue, formatWordClasses,
  getPartsOfSpeech, getWordById, getWordClassesByWord, userFacingFieldName,
  IPartOfSpeech, IWord, IWordClassNoPOS
} from '../wordData.tsx';
import { useSetPageTitle } from '../utils.tsx';

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

function WordGrammarTable({ table, grammarForms, cells }: IWordGrammarTable) {
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
}

interface IDisplayWordGrammarTable {
  word: IWord;
  tableOverview: IGrammarTableIdAndName;
  partsOfSpeech: IPartOfSpeech[];
}

function DisplayWordGrammarTable({ word, tableOverview, partsOfSpeech }: IDisplayWordGrammarTable) {
  const [ showTable, setShowTable ] = useState(false);
  
  const tableQuery = getGrammarTableById(tableOverview.id, showTable);
  const grammarFormsQuery = getGrammarForms(showTable);
  const runQuery = useRunGrammarTableOnWordQuery(tableOverview.id, word.word, showTable);

  const tableNode = showTable && (() => {
    const queries = [ tableQuery, grammarFormsQuery, runQuery ];
    for(const query of queries) {
      if(query.status === 'error') {
        return <p><b>Error: { query.error.message }</b></p>;
      }
    }
    for(const query of queries) {
      if(query.fetchStatus === 'fetching') {
        return <p><b>Loading...</b></p>;
      }
    }
    return (
      <div style={{ margin: "0 0 1em" }}>
        <small style={{ display: "inline-block", marginBottom: "0.5em" }}>
          <Link to={ '/grammar-table/' + tableOverview.id }>
            [view table]
          </Link>
          {" "}
          <Link to={ '/edit-grammar-table/' + tableOverview.id }>
            [edit table]
          </Link>
        </small>
        <WordGrammarTable
          table={ tableQuery.data! }
          grammarForms={ grammarFormsQuery.data! }
          cells={ runQuery.data! }
        />
      </div>
    );
  })();
  
  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={showTable}
          onChange={ e => setShowTable(e.target.checked) }
        />
        {" "}
        { tableOverview.name || `[${formatPosFieldValue(word.pos, partsOfSpeech)}]` }
      </label>
      {tableNode}
    </li>
  );
}

interface IViewWordInner {
  word: IWord;
  classes: IWordClassNoPOS[];
  tables: IGrammarTableIdAndName[];
  partsOfSpeech: IPartOfSpeech[];
}

function ViewWordInner({ word, classes, tables, partsOfSpeech }: IViewWordInner) {
  const fields = [
    'word', 'ipa', 'meaning', 'pos', 'classes',
    'etymology', 'notes', 'created', 'updated'
  ] as (keyof IWord | 'classes')[];
  
  return (
    <>
      <h2>View Word</h2>
      <table className="info-table">
        <tbody>
          <tr>
            <th>Language:</th>
            <td>
              <LanguageLink id={ word.langId } />
            </td>
          </tr>
          {
            fields.map(field =>
              (field === 'classes' ? classes.length > 0 : word[field]) && (
                <tr key={field}>
                  <th>{ userFacingFieldName(field) }:</th>
                  <td style={{ whiteSpace: "pre-wrap" }}>
                    {
                      field === 'pos'
                      ? formatPosFieldValue(word.pos, partsOfSpeech)
                      : (field === 'classes'
                         ? formatWordClasses(classes)
                         : formatDictionaryFieldValue(word, field)
                        )
                    }
                  </td>
                </tr>
              )
            )
          }
        </tbody>
      </table>
      <p><Link to={ '/edit-word/' + word.id }>Edit word</Link></p>
      <p><Link to={ `/add-word/${word.langId}?copy=${word.id}` }>Copy word</Link></p>
      <p><Link to={ '/delete-word/' + word.id }>Delete word</Link></p>
      {
        tables.length > 0 && <>
          <h3>Grammar Tables</h3>
          <ul className="word-grammar-tables-list">
            {
              tables.map(table => (
                <DisplayWordGrammarTable
                  word={word}
                  tableOverview={table}
                  partsOfSpeech={partsOfSpeech}
                  key={ table.id }
                />
              ))
            }
          </ul>
        </>
      }
    </>
  );
};

export default function ViewWord() {
  const { id } = useParams();
  if(!id) {
    throw new Error("No word ID was provided");
  }

  const wordResponse = getWordById(id);
  const classesResponse = getWordClassesByWord(id);
  const tablesResponse = getGrammarTablesForWord(id);
  const partsOfSpeechResponse = getPartsOfSpeech();
  
  useSetPageTitle("View Word");

  if(wordResponse.status === 'pending') {
    return <p>Loading word summary...</p>;
  } else if(wordResponse.status === 'error') {
    return (
      <>
        <h2>{ wordResponse.error.title }</h2>
        <p>{ wordResponse.error.message }</p>
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
  
  if(tablesResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(tablesResponse.status === 'error') {
    return (
      <p>{ tablesResponse.error.message }</p>
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
    <ViewWordInner
      word={ wordResponse.data }
      classes={ classesResponse.data }
      tables={ tablesResponse.data }
      partsOfSpeech={ partsOfSpeechResponse.data }
    />
  );
};
