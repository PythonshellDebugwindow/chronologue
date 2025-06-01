import { Link } from 'react-router-dom';

import {
  LanguageTranslationDateAndLinks,
  LanguageTranslationsTable,
  TranslationContent,
  TranslationDateAndLinks,
  TranslationRow,
  TranslationWIPText
} from '@/components/Translations';

import { useLanguage } from '@/hooks/languages';
import { useLanguageTranslations } from '@/hooks/translations';

import { ILanguage } from '@/types/languages';
import { ILanguageTranslationOverview } from '@/types/translations';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

interface ILanguageTranslationRow {
  langTranslation: ILanguageTranslationOverview;
  language: ILanguage;
}

function LanguageTranslationRow(
  { langTranslation: langTr, language }: ILanguageTranslationRow
) {
  return (
    <TranslationRow workInProgress={langTr.workInProgress}>
      <td>
        <TranslationDateAndLinks translationId={langTr.translId} />
        <TranslationContent>{langTr.translText}</TranslationContent>
      </td>
      <td>
        <LanguageTranslationDateAndLinks
          created={langTr.created}
          translationId={langTr.translId}
          languageId={language.id}
        />
        <TranslationContent>
          {langTr.workInProgress && (
            <>
              <TranslationWIPText />
              <br />
            </>
          )}
          {langTr.content}
        </TranslationContent>
      </td>
    </TranslationRow>
  );
}

interface IViewLanguageTranslationsInner {
  langTranslations: ILanguageTranslationOverview[];
  language: ILanguage;
}

function ViewLanguageTranslationsInner(
  { langTranslations, language }: IViewLanguageTranslationsInner
) {
  return (
    <>
      <h2>View Language Translations</h2>
      <p>
        Viewing <Link to={'/language/' + language.id}>{language.name}</Link>'s
        translations.
      </p>
      <LanguageTranslationsTable>
        <tr>
          <th>Text</th>
          <th>Translation</th>
        </tr>
        {langTranslations.map(langTr => (
          <LanguageTranslationRow
            langTranslation={langTr}
            language={language}
            key={langTr.translId}
          />
        ))}
      </LanguageTranslationsTable>
      {langTranslations.length === 0 && (
        <p>You have not yet translated anything into {language.name}.</p>
      )}
    </>
  );
}

export default function ViewLanguageTranslations() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(id);
  const langTranslationsResponse = useLanguageTranslations(id);

  useSetPageTitle("View Language Translations");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(langTranslationsResponse.status !== 'success') {
    return renderDatalessQueryResult(langTranslationsResponse);
  }

  return (
    <ViewLanguageTranslationsInner
      language={languageResponse.data}
      langTranslations={langTranslationsResponse.data}
    />
  );
}
