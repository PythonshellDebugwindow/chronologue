import { Link } from 'react-router-dom';

import DisplayDate from '@/components/DisplayDate';

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
    <tr className={langTr.workInProgress ? "translation-wip" : undefined}>
      <td>
        <p className="translation-date">
          <Link to={`/translation/${langTr.translId}`}>
            View translation
          </Link>
          <span style={{ float: "right" }}>
            <Link to={`/edit-translation/${langTr.translId}`}>
              [edit]
            </Link>
            {" "}
            <Link to={`/delete-translation/${langTr.translId}`}>
              [delete]
            </Link>
          </span>
        </p>
        <p className="translation-content">{langTr.translText}</p>
      </td>
      <td>
        <p className="translation-date">
          Added on <DisplayDate date={langTr.created} />
          <span style={{ float: "right" }}>
            <Link to={`/translation/${langTr.translId}?lang=${language.id}`}>
              [link]
            </Link>
            {" "}
            <Link to={`/translate-text/${langTr.translId}?lang=${language.id}`}>
              [edit]
            </Link>
            {" "}
            <Link to={`/delete-text-translation/${langTr.translId}?lang=${language.id}`}>
              [delete]
            </Link>
          </span>
        </p>
        <p className="translation-content">
          {langTr.workInProgress && (
            <>
              <span className="translation-wip-text">Work In Progress</span>
              <br />
            </>
          )}
          {langTr.content}
        </p>
      </td>
    </tr>
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
      <table className="language-translations-table ltt-equal">
        <tbody>
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
        </tbody>
      </table>
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
