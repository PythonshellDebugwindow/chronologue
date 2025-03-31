import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import {
  compareGrammarTables, formatPeriodSeparatedGrammarForms, getGrammarForms,
  getGrammarTablesByLanguage, IGrammarForm, IGrammarTableOverview
} from '../grammarData.tsx';
import { ILanguage, getLanguageById } from '../languageData.tsx';
import {
  renderDatalessQueryResult, useGetParamsOrSelectedId, useSetPageTitle
} from '../utils.tsx';
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

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(tablesResponse.status !== 'success') {
    return renderDatalessQueryResult(tablesResponse);
  }

  if(grammarFormsResponse.status !== 'success') {
    return renderDatalessQueryResult(grammarFormsResponse);
  }

  if(partsOfSpeechResponse.status !== 'success') {
    return renderDatalessQueryResult(partsOfSpeechResponse);
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
