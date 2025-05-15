import { Link } from 'react-router-dom';

import DisplayDate from '../components/DisplayDate.tsx';

import { ILanguage, useLanguage } from '../languageData.tsx';
import {
  ITranslationOverview, useLanguageTranslationIds, useTranslations
} from '../translationData.tsx';
import {
  renderDatalessQueryResult, useGetParamsOrSelectedId, useSetPageTitle
} from '../utils.tsx';

function summarise(text: string) {
  const maxLength = 50;
  if(text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

interface IViewTranslationsInner {
  translations: ITranslationOverview[];
  langTranslations: string[];
  language: ILanguage;
}

function ViewTranslationsInner({ translations, langTranslations, language }: IViewTranslationsInner) {
  return (
    <>
      <h2>View Translations</h2>
      <p>
        Viewing all translations. Rows in yellow have not been translated to{" "}
        <Link to={'/language/' + language.id}>{language.name}</Link>.
      </p>
      <table className="translations-table">
        <tbody>
          <tr>
            <th>Summary</th>
            <th>Languages</th>
            <th>Created</th>
          </tr>
          {translations.map(translation => (
            <tr
              className={langTranslations.includes(translation.id) ? "" : "unadded-translation"}
              key={translation.id}
            >
              <td>
                <Link to={'/translation/' + translation.id}>
                  {summarise(translation.content)}
                </Link>
              </td>
              <td>
                {translation.numLanguages}
              </td>
              <td>
                <DisplayDate date={translation.created} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {translations.length === 0 && (
        <p>You have not added any translations yet.</p>
      )}
    </>
  );
}

export default function ViewTranslations() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }

  const translationsResponse = useTranslations();
  const langTranslationsResponse = useLanguageTranslationIds(id);
  const languageResponse = useLanguage(id);

  useSetPageTitle("View Translations");

  if(translationsResponse.status !== 'success') {
    return renderDatalessQueryResult(translationsResponse);
  }

  if(langTranslationsResponse.status !== 'success') {
    return renderDatalessQueryResult(langTranslationsResponse);
  }

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  return (
    <ViewTranslationsInner
      translations={translationsResponse.data}
      langTranslations={langTranslationsResponse.data}
      language={languageResponse.data}
    />
  );
};
