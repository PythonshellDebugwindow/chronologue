import { useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';

import { useLanguage } from '@/hooks/languages';
import { useLanguageTranslation, useTranslation } from '@/hooks/translations';

import { ILanguage } from '@/types/languages';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendRequest } from '@/utils/global/queries';

interface IDeleteTextTranslationInner {
  language: ILanguage;
  translationId: string;
  isTranslated: boolean;
}

function DeleteTextTranslationInner(
  { language, translationId, isTranslated }: IDeleteTextTranslationInner
) {
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState("");

  if(!isTranslated) {
    return (
      <>
        <h2>Text Translation Not Found</h2>
        <p>
          <Link to={`/translation/${translationId}?lang=${language.id}`}>This text</Link>
          {" "}has not been translated into{" "}
          <Link to={'/language/' + language.id}>{language.name}</Link>.
        </p>
      </>
    );
  }

  async function deleteFormTextTranslation() {
    const result = await sendBackendRequest(
      `translations/${translationId}/languages/${language.id}`, 'DELETE'
    );
    if(!result.ok) {
      setErrorMessage(result.body.message);
      return;
    }

    navigate('/translation/' + translationId);
  }

  return (
    <>
      <h2>Delete Text Translation</h2>
      <p>
        Really delete your translation of{" "}
        <Link to={`/translation/${translationId}?lang=${language.id}`}>this text</Link>
        {" "}into <Link to={'/language/' + language.id}>{language.name}</Link>?
      </p>
      <p>
        <b>This action cannot be undone!</b>
      </p>
      <button onClick={deleteFormTextTranslation} style={{ marginBottom: "15px" }}>
        Delete translation
      </button>
      <br />
      <button onClick={() => navigate(-1)}>
        Go back
      </button>
      {errorMessage && <p><b>Error: {errorMessage}</b></p>}
    </>
  );
}

export default function DeleteTextTranslation() {
  const [searchParams] = useSearchParams();
  const langId = searchParams.get('lang');

  const { id: translId } = useParams();

  if(!langId) {
    throw new Error("No language ID was provided");
  } else if(!translId) {
    throw new Error("No translation ID was provided");
  }

  const languageResponse = useLanguage(langId);
  const translationResponse = useTranslation(translId);
  const langTrResponse = useLanguageTranslation(langId, translId);

  useSetPageTitle("Delete Text Translation");

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
    <DeleteTextTranslationInner
      language={languageResponse.data}
      translationId={translId}
      isTranslated={langTrResponse.data !== null}
    />
  );
};
