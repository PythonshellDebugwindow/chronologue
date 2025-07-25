import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import GrammarTableLink from '@/components/GrammarTableLink';

import { useGrammarForms, useLanguageGrammarTables } from '@/hooks/grammar';
import { useLanguage } from '@/hooks/languages';
import { usePartsOfSpeech } from '@/hooks/words';

import { IGrammarForm, IGrammarTableOverview } from '@/types/grammar';
import { ILanguage } from '@/types/languages';
import { IPartOfSpeech } from '@/types/words';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

import {
  compareGrammarTables,
  formatPeriodSeparatedGrammarForms
} from '@/utils/grammar';

import styles from './ViewGrammarTables.module.css';

function formatGrammarFormsList(codes: string[], grammarForms: IGrammarForm[]) {
  return codes.map((code, i) => {
    const posNodes = formatPeriodSeparatedGrammarForms(code, grammarForms);
    return <Fragment key={i}>{i > 0 && ", "}{posNodes}</Fragment>;
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
        Viewing <Link to={'/language/' + language.id}>{language.name}</Link>'s grammar tables.
      </p>
      <div className={styles.grammarTablesGrid}>
        {tables.map(table => (
          <div key={table.id}>
            <GrammarTableLink
              table={table}
              partsOfSpeech={partsOfSpeech}
            />
            <br />
            {formatGrammarFormsList(table.rows, grammarForms)}
            ; {formatGrammarFormsList(table.columns, grammarForms)}
          </div>
        ))}
      </div>
    </>
  );
}

export default function ViewGrammarTables() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(id);
  const tablesResponse = useLanguageGrammarTables(id);
  const grammarFormsResponse = useGrammarForms();
  const partsOfSpeechResponse = usePartsOfSpeech();

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
      language={languageResponse.data}
      tables={tablesResponse.data}
      grammarForms={grammarFormsResponse.data}
      partsOfSpeech={partsOfSpeechResponse.data}
    />
  );
}
