import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import {
  compareGrammarTables, formatPeriodSeparatedGrammarForms, getGrammarForms,
  getGrammarTablesByLanguage, IGrammarForm, IGrammarTableOverview
} from '../grammarData.tsx';
import { ILanguage, getLanguageById } from '../languageData.tsx';
import { useGetParamsOrSelectedId, useSetPageTitle } from '../utils.tsx';
import {
  formatPosFieldValue, getPartsOfSpeech, IPartOfSpeech
} from '../wordData.tsx';

function formatGrammarFormsList(codes: string[], grammarForms: IGrammarForm[]) {
  return codes.flatMap((code, i) => {
    const posNodes = formatPeriodSeparatedGrammarForms(code, grammarForms);
    return <Fragment key={i}>{ i > 0 && ", " }{posNodes}</Fragment>
  });
}

interface IViewGrammarTablesInner {
  language: ILanguage;
  tables: IGrammarTableOverview[];
  grammarForms: IGrammarForm[];
  partsOfSpeech: IPartOfSpeech[];
}

function ViewGrammarTablesInner({ language, tables, grammarForms, partsOfSpeech }: IViewGrammarTablesInner) {
  tables.sort(compareGrammarTables);

  return (
    <>
      <h2>View Grammar Tables</h2>
      <p>
        Viewing <Link to={ '/language/' + language.id }>{ language.name }</Link>'s grammar tables.
      </p>
      <div className="grammar-tables-grid">
        {
          tables.map(table => (
            <div key={table.id}>
              <Link to={ '/grammar-table/' + table.id}>
                { table.name && (table.name + " ") }
                [{ formatPosFieldValue(table.pos, partsOfSpeech) }]
              </Link>
              <br />
              { formatGrammarFormsList(table.rows, grammarForms) }
              ; { formatGrammarFormsList(table.columns, grammarForms) }
            </div>
          ))
        }
      </div>
    </>
  );
}

export default function ViewGrammarTables() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }
  
  const languageResponse = getLanguageById(id);
  const tablesResponse = getGrammarTablesByLanguage(id);
  const grammarFormsResponse = getGrammarForms();
  const partsOfSpeechResponse = getPartsOfSpeech();
  
  const language = languageResponse.data;
  useSetPageTitle(language ? language.name + "'s Grammar Tables" : "Grammar Tables");

  if(languageResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(languageResponse.status === 'error') {
    return (
      <>
        <h2>{ languageResponse.error.title }</h2>
        <p>{ languageResponse.error.message }</p>
      </>
    );
  }

  if(tablesResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(tablesResponse.status === 'error') {
    return (
      <>
        <h2>{ tablesResponse.error.title }</h2>
        <p>{ tablesResponse.error.message }</p>
      </>
    );
  }

  if(grammarFormsResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(grammarFormsResponse.status === 'error') {
    return (
      <>
        <h2>{ grammarFormsResponse.error.title }</h2>
        <p>{ grammarFormsResponse.error.message }</p>
      </>
    );
  }

  if(partsOfSpeechResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(partsOfSpeechResponse.status === 'error') {
    return (
      <>
        <h2>{ partsOfSpeechResponse.error.title }</h2>
        <p>{ partsOfSpeechResponse.error.message }</p>
      </>
    );
  }
  
  return (
    <ViewGrammarTablesInner
      language={ languageResponse.data }
      tables={ tablesResponse.data }
      grammarForms={ grammarFormsResponse.data }
      partsOfSpeech={ partsOfSpeechResponse.data }
    />
  );
};
