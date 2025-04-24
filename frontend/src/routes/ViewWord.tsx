import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import LanguageLink from '../components/LanguageLink.tsx';
import WordGrammarTable from '../components/WordGrammarTable.tsx';

import {
  useGrammarForms, useGrammarTable, useWordGrammarTables,
  useRunGrammarTableOnWordQuery, IGrammarTableIdAndName
} from '../grammarData.tsx';
import { renderDatalessQueryResult, useSetPageTitle } from '../utils.tsx';
import {
  formatDictionaryFieldValue, formatPosFieldValue, formatWordClasses,
  formatWordEtymology, usePartsOfSpeech, useWord, useWordClasses, userFacingFieldName,
  IPartOfSpeech, IWord, IWordClassNoPOS
} from '../wordData.tsx';

interface IDisplayWordGrammarTable {
  word: IWord;
  tableOverview: IGrammarTableIdAndName;
  partsOfSpeech: IPartOfSpeech[];
}

function DisplayWordGrammarTable({ word, tableOverview, partsOfSpeech }: IDisplayWordGrammarTable) {
  const [showTable, setShowTable] = useState(false);

  const tableQuery = useGrammarTable(tableOverview.id, showTable);
  const grammarFormsQuery = useGrammarForms(showTable);
  const runQuery = useRunGrammarTableOnWordQuery(tableOverview.id, word.id, showTable);

  const tableNode = showTable && (() => {
    const queries = [tableQuery, grammarFormsQuery, runQuery];
    for(const query of queries) {
      if(query.status === 'error') {
        return <p><b>Error: {query.error.message}</b></p>;
      }
    }
    for(const query of queries) {
      if(query.fetchStatus === 'fetching') {
        return <p><b>Loading...</b></p>;
      }
    }
    return (
      <div className="word-grammar-table-container" style={{ margin: "0 0 1em" }}>
        <small>
          <Link to={'/grammar-table/' + tableOverview.id}>
            [view table]
          </Link>
          {" "}
          <Link to={'/edit-grammar-table/' + tableOverview.id}>
            [edit table]
          </Link>
          {" "}
          <Link to={`/irregular-forms/${tableOverview.id}?word=${word.id}`}>
            [irregular forms]
          </Link>
        </small>
        <WordGrammarTable
          table={tableQuery.data!}
          grammarForms={grammarFormsQuery.data!}
          cells={runQuery.data!}
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
          onChange={e => setShowTable(e.target.checked)}
        />
        {" "}
        {tableOverview.name || `[${formatPosFieldValue(word.pos, partsOfSpeech)}]`}
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

  function formatFieldValue(field: keyof IWord | 'classes') {
    switch(field) {
      case 'pos':
        return formatPosFieldValue(word.pos, partsOfSpeech);
      case 'classes':
        return formatWordClasses(classes);
      case 'etymology':
        return formatWordEtymology(word[field]);
      default:
        return formatDictionaryFieldValue(word, field);
    }
  }

  return (
    <>
      <h2>View Word</h2>
      <table className="info-table">
        <tbody>
          <tr>
            <th>Language:</th>
            <td>
              <LanguageLink id={word.langId} />
            </td>
          </tr>
          {fields.map(field => (
            (field === 'classes' ? classes.length > 0 : word[field]) && (
              <tr key={field}>
                <th>{userFacingFieldName(field)}:</th>
                <td style={{ whiteSpace: "pre-wrap" }}>
                  {formatFieldValue(field)}
                </td>
              </tr>
            )
          ))}
        </tbody>
      </table>
      <p><Link to={'/edit-word/' + word.id}>Edit word</Link></p>
      <p><Link to={`/add-word/${word.langId}?copy=${word.id}`}>Copy word</Link></p>
      <p><Link to={'/delete-word/' + word.id}>Delete word</Link></p>
      {tables.length > 0 && (
        <>
          <h3>Grammar Tables</h3>
          <ul className="word-grammar-tables-list">
            {tables.map(table => (
              <DisplayWordGrammarTable
                word={word}
                tableOverview={table}
                partsOfSpeech={partsOfSpeech}
                key={table.id}
              />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export default function ViewWord() {
  const { id } = useParams();
  if(!id) {
    throw new Error("No word ID was provided");
  }

  const wordResponse = useWord(id);
  const classesResponse = useWordClasses(id);
  const tablesResponse = useWordGrammarTables(id);
  const partsOfSpeechResponse = usePartsOfSpeech();

  useSetPageTitle("View Word");

  if(wordResponse.status !== 'success') {
    return renderDatalessQueryResult(wordResponse);
  }

  if(classesResponse.status !== 'success') {
    return renderDatalessQueryResult(classesResponse);
  }

  if(tablesResponse.status !== 'success') {
    return renderDatalessQueryResult(tablesResponse);
  }

  if(partsOfSpeechResponse.status !== 'success') {
    return renderDatalessQueryResult(partsOfSpeechResponse);
  }

  return (
    <ViewWordInner
      word={wordResponse.data}
      classes={classesResponse.data}
      tables={tablesResponse.data}
      partsOfSpeech={partsOfSpeechResponse.data}
    />
  );
};
