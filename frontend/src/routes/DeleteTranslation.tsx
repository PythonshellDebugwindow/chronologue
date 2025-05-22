import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useTranslation } from '@/hooks/translations';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendRequest } from '@/utils/global/queries';

function DeleteTranslationInner({ translationId }: { translationId: string }) {
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState("");

  async function deleteFormTranslation() {
    const result = await sendBackendRequest(`translations/${translationId}`, 'DELETE');
    if(!result.ok) {
      setErrorMessage(result.body.message);
      return;
    }

    navigate('/translations');
  }

  return (
    <>
      <h2>Delete Translation</h2>
      <p>
        Really delete <Link to={'/translation/' + translationId}>this translation</Link>?
      </p>
      <p>
        <b>This action cannot be undone!</b>
      </p>
      <button onClick={deleteFormTranslation} style={{ marginBottom: "15px" }}>
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

export default function DeleteTranslation() {
  const { id } = useParams();
  if(!id) {
    throw new Error("No translation ID was provided");
  }

  const translationResponse = useTranslation(id);

  useSetPageTitle("Delete Translation");

  if(translationResponse.status !== 'success') {
    return renderDatalessQueryResult(translationResponse);
  }

  return <DeleteTranslationInner translationId={id} />;
};
