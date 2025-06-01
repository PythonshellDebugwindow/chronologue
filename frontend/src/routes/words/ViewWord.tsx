import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import DisplayDate from '@/components/DisplayDate';
import { GrammarTableLinks } from '@/components/GrammarTable';
import WordGrammarTable from '@/components/WordGrammarTable';

import {
  useGrammarForms,
  useGrammarTable,
  useRunGrammarTableOnWordQuery,
  useWordGrammarTables
} from '@/hooks/grammar';
import { useLanguage } from '@/hooks/languages';
import { usePartsOfSpeech, useWord, useWordClasses } from '@/hooks/words';

import { IGrammarTableIdAndName } from '@/types/grammar';
import { ILanguage } from '@/types/languages';
import { IPartOfSpeech, IWord, IWordClassNoPOS } from '@/types/words';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

import {
  formatPosFieldValue,
  formatWordClasses,
  formatWordEtymology
} from '@/utils/words';

import styles from './ViewWord.module.css';

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
      <div className={styles.grammarTableContainer}>
        <GrammarTableLinks>
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
        </GrammarTableLinks>
        <WordGrammarTable
          table={tableQuery.data!}
          grammarForms={grammarFormsQuery.data!}
          cells={runQuery.data!}
        />
      </div>
    );
  })();

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={showTable}
          onChange={e => setShowTable(e.target.checked)}
        />
        {" "}
        <span>
          {tableOverview.name || `[${formatPosFieldValue(word.pos, partsOfSpeech)}]`}
        </span>
      </label>
      {tableNode}
    </div>
  );
}

interface IViewWordInner {
  word: IWord;
  classes: IWordClassNoPOS[];
  tables: IGrammarTableIdAndName[];
  language: ILanguage;
  partsOfSpeech: IPartOfSpeech[];
}

function ViewWordInner({ word, classes, tables, language, partsOfSpeech }: IViewWordInner) {
  return (
    <>
      <h2>View Word</h2>
      <div className={styles.wordTable}>
        <div className={styles.twoColumns}>
          <div>
            <div className={styles.word}>
              {language.status === 'proto' && "*"}{word.word}
            </div>
            {word.ipa && (
              <div className={styles.ipa}>
                [{word.ipa}]
              </div>
            )}
            <div className={styles.meaning} style={{ paddingTop: word.ipa ? "2px" : "5px" }}>
              {word.meaning}
            </div>
            <div className={styles.language}>
              <Link to={'/language/' + language.id}>{language.name}</Link>
            </div>
          </div>
          <div>
            <div className={styles.pos}>
              [{formatPosFieldValue(word.pos, partsOfSpeech)}]
            </div>
            {classes.length > 0 && (
              <div className={styles.classes}>
                {formatWordClasses(classes)}
              </div>
            )}
          </div>
        </div>
        {word.etymology && (
          <div className={styles.borderedText}>
            <div>Etymology</div>
            <div>{formatWordEtymology(word.etymology)}</div>
          </div>
        )}
        {word.notes && (
          <div className={styles.borderedText}>
            <div>Notes</div>
            <div>{word.notes}</div>
          </div>
        )}
        <div className={styles.date}>
          Created <DisplayDate date={word.created} />
        </div>
        {word.updated && (
          <div className={styles.date}>
            Updated <DisplayDate date={word.updated} />
          </div>
        )}
      </div>
      <p>
        <Link to={'/edit-word/' + word.id}>Edit</Link>
        {" "}&bull;{" "}
        <Link to={`/add-word/${word.langId}?copy=${word.id}`}>Copy</Link>
        {" "}&bull;{" "}
        <Link to={'/delete-word/' + word.id}>Delete</Link>
      </p>
      {tables.length > 0 && (
        <>
          <h3>Grammar Tables</h3>
          <div className={styles.grammarTablesList}>
            {tables.map(table => (
              <DisplayWordGrammarTable
                word={word}
                tableOverview={table}
                partsOfSpeech={partsOfSpeech}
                key={table.id}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function ViewWordWithWord({ word }: { word: IWord }) {
  const classesResponse = useWordClasses(word.id);
  const tablesResponse = useWordGrammarTables(word.id);
  const languageResponse = useLanguage(word.langId);
  const partsOfSpeechResponse = usePartsOfSpeech();

  useSetPageTitle("View Word");

  if(classesResponse.status !== 'success') {
    return renderDatalessQueryResult(classesResponse);
  }

  if(tablesResponse.status !== 'success') {
    return renderDatalessQueryResult(tablesResponse);
  }

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(partsOfSpeechResponse.status !== 'success') {
    return renderDatalessQueryResult(partsOfSpeechResponse);
  }

  return (
    <ViewWordInner
      word={word}
      classes={classesResponse.data}
      tables={tablesResponse.data}
      language={languageResponse.data}
      partsOfSpeech={partsOfSpeechResponse.data}
    />
  );
}

export default function ViewWord() {
  const { id } = useParams();
  if(!id) {
    throw new Error("No word ID was provided");
  }

  const wordResponse = useWord(id);

  useSetPageTitle("View Word");

  if(wordResponse.status !== 'success') {
    return renderDatalessQueryResult(wordResponse);
  }

  return <ViewWordWithWord word={wordResponse.data} />;
}
