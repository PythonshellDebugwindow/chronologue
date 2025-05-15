import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import DisplayDate from '../components/DisplayDate.tsx';
import LanguageLink from '../components/LanguageLink.tsx';

import { useEstimateWordIPAQuery } from '../phoneData.tsx';
import {
  ILanguageTranslation, ITranslation, useTranslation, useTranslationLanguages
} from '../translationData.tsx';
import { renderDatalessQueryResult, useSetPageTitle } from '../utils.tsx';

interface ILanguageTranslationRow {
  languageTranslation: ILanguageTranslation;
}

function TranslationIpaEstimate({ languageTranslation: langTr }: ILanguageTranslationRow) {
  const query = useEstimateWordIPAQuery(langTr.langId, langTr.content);

  if(query.status === 'pending') {
    return "Estimating IPA...";
  } else if(query.status === 'error') {
    return "Error: " + query.error.message;
  }

  return query.data;
}

function LanguageTranslationRow({ languageTranslation: langTr }: ILanguageTranslationRow) {
  const [showingIpa, setShowingIpa] = useState(false);
  const [showingNotes, setShowingNotes] = useState(false);
  const [showingGloss, setShowingGloss] = useState(false);

  return (
    <tr>
      <td>
        <LanguageLink id={langTr.langId} />
      </td>
      <td>
        <p className="translation-date">Added on <DisplayDate date={langTr.created} /></p>
        <p className="translation-content">{langTr.content}</p>
        <div className="translation-dropdowns">
          <div className="clickable-alphabet-dropdown">
            <span onClick={() => setShowingIpa(!showingIpa)}>
              IPA {showingIpa ? "▼" : "▶"}
            </span>
          </div>
          {langTr.notes && (
            <div className="clickable-alphabet-dropdown">
              <span onClick={() => setShowingNotes(!showingNotes)}>
                Notes {showingNotes ? "▼" : "▶"}
              </span>
            </div>
          )}
          {langTr.gloss && (
            <div className="clickable-alphabet-dropdown">
              <span onClick={() => setShowingGloss(!showingGloss)}>
                Gloss {showingGloss ? "▼" : "▶"}
              </span>
            </div>
          )}
        </div>
        {showingIpa && (
          <p className="translation-content-small">
            {
              langTr.ipa
                ? langTr.ipa
                : <TranslationIpaEstimate languageTranslation={langTr} />
            }
          </p>
        )}
        {showingNotes && (
          <p className="translation-content-small">{langTr.notes}</p>
        )}
        {showingGloss && (
          <p className="translation-content-small">{langTr.gloss}</p>
        )}
      </td>
    </tr>
  );
}

interface IViewTranslationInner {
  translation: ITranslation;
  languageTranslations: ILanguageTranslation[];
}

function ViewTranslationInner({ translation, languageTranslations }: IViewTranslationInner) {
  return (
    <div>
      <h2>View Translation</h2>
      <table className="info-table">
        <tbody>
          <tr>
            <th>Created:</th>
            <td>
              <DisplayDate date={translation.created} />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="translation-info">
        <h4>Content:</h4>
        <p>{translation.content}</p>
      </div>
      {translation.notes && (
        <div className="translation-info translation-info-small">
          <h4>Notes:</h4>
          <p>{translation.notes}</p>
        </div>
      )}
      <p><Link to={'/edit-translation/' + translation.id}>Edit translation</Link></p>
      <h3>Languages</h3>
      {languageTranslations.length > 0 && (
        <table className="language-translations-table">
          <tbody>
            {languageTranslations.map(langTr => (
              <LanguageTranslationRow
                languageTranslation={langTr}
                key={langTr.langId}
              />
            ))}
          </tbody>
        </table>
      )}
      {languageTranslations.length === 0 && (
        <p>You have not yet translated this text into any languages.</p>
      )}
    </div>
  );
}

export default function ViewTranslation() {
  const { id } = useParams();
  if(!id) {
    throw new Error("No translation ID was provided");
  }

  const translationResponse = useTranslation(id);
  const languagesResponse = useTranslationLanguages(id);

  useSetPageTitle("View Translation");

  if(translationResponse.status !== 'success') {
    return renderDatalessQueryResult(translationResponse);
  }

  if(languagesResponse.status !== 'success') {
    return renderDatalessQueryResult(languagesResponse);
  }

  return (
    <ViewTranslationInner
      translation={translationResponse.data}
      languageTranslations={languagesResponse.data}
    />
  );
};
