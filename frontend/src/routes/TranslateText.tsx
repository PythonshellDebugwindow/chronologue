import { useContext, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import LinkButton from '@/components/LinkButton';

import SelectedLanguageContext from '@/contexts/SelectedLanguageContext';

import { useLanguage } from '@/hooks/languages';
import { useLanguageTranslation, useTranslation } from '@/hooks/translations';

import { ILanguage } from '@/types/languages';
import { ILanguageTranslation, ITranslation } from '@/types/translations';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

interface ITranslateTextInner {
  language: ILanguage;
  translation: ITranslation;
  langTr: ILanguageTranslation | null;
}

function TranslateTextInner(
  { language, translation, langTr }: ITranslateTextInner
) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState(langTr?.content ?? "");
  const [ipa, setIpa] = useState(langTr?.ipa ?? "");
  const [notes, setNotes] = useState(langTr?.notes ?? "");
  const [gloss, setGloss] = useState(langTr?.gloss ?? "");
  const [workInProgress, setWorkInProgress] = useState(langTr?.workInProgress ?? false);
  const [message, setMessage] = useState("");

  async function estimateIpa() {
    try {
      const response = await sendBackendJson(
        `languages/${language.id}/estimate-ipa`, 'POST', { word: content }
      );
      if(response.ok) {
        setIpa(response.body);
      } else {
        setMessage(response.body.message);
      }
    } catch(err) {
      setMessage((err as Error).message);
    }
  }

  async function saveFormTranslation() {
    if(!content) {
      setMessage("Please enter a translation.");
      return;
    }

    const data = { content, ipa, notes, gloss, workInProgress };
    const result = await sendBackendJson(
      `translations/${translation.id}/languages/${language.id}`, 'PUT', data
    );
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }

    queryClient.resetQueries({
      queryKey: ['translations', translation.id, 'languages', language.id]
    });
    navigate(`/translation/${translation.id}?lang=${language.id}`);
  }

  return (
    <>
      <h2>Translate Text</h2>
      <p style={{ marginBottom: "0.5em" }}>
        Translating <Link to={'/translation/' + translation.id}>this translation</Link>
        {" "}into <Link to={'/language/' + language.id}>{language.name}</Link>.
      </p>
      <div>
        <div className="translation-info">
          <p>{translation.content}</p>
        </div>
        {translation.notes && (
          <div className="translation-info translation-info-small">
            <p>{translation.notes}</p>
          </div>
        )}
        {message && <p style={{ marginBottom: "0" }}><b>{message}</b></p>}
        <div className="translation-info">
          <h4>Text:</h4>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            spellCheck={false}
            style={{ height: "10.5em" }}
          />
          <h4 style={{ marginBottom: "0" }}>IPA:</h4>
          <div style={{ position: "relative", top: "-5px" }}>
            <small>
              <LinkButton onClick={estimateIpa}>[estimate]</LinkButton>
            </small>
          </div>
          <textarea
            value={ipa}
            onChange={e => setIpa(e.target.value)}
            spellCheck={false}
          />
          <h4>Gloss:</h4>
          <textarea
            value={gloss}
            onChange={e => setGloss(e.target.value)}
            spellCheck={false}
          />
          <h4>Notes:</h4>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>
      <p style={{ marginTop: "5px" }}>
        <label>
          Work in progress?{" "}
          <input
            type="checkbox"
            checked={workInProgress}
            onChange={e => setWorkInProgress(e.target.checked)}
          />
        </label>
      </p>
      {message && <p><b>{message}</b></p>}
      <button type="button" onClick={saveFormTranslation}>
        {langTr ? "Save Changes" : "Add Translation"}
      </button>
    </>
  );
}

export default function TranslateText() {
  const [searchParams] = useSearchParams();
  const searchLangId = searchParams.get('lang');

  const selectedLangId = useContext(SelectedLanguageContext).selectedLanguage?.id;

  const langId = searchLangId ?? selectedLangId;

  const { id: translId } = useParams();

  if(!langId) {
    throw new Error("No language ID was provided");
  } else if(!translId) {
    throw new Error("No translation ID was provided");
  }

  const languageResponse = useLanguage(langId);
  const translationResponse = useTranslation(translId);
  const langTrResponse = useLanguageTranslation(langId, translId);

  useSetPageTitle("Translate Text");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(translationResponse.status !== 'success') {
    return renderDatalessQueryResult(translationResponse);
  }

  if(langTrResponse.status !== 'success') {
    return renderDatalessQueryResult(langTrResponse);
  }

  return (
    <TranslateTextInner
      language={languageResponse.data}
      translation={translationResponse.data}
      langTr={langTrResponse.data}
    />
  );
};
