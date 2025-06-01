import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { TranslationInfo } from '@/components/Translations';

import { useTranslation } from '@/hooks/translations';

import { ITranslation } from '@/types/translations';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

function EditTranslationInner({ initialTranslation }: { initialTranslation: ITranslation }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState(initialTranslation.content);
  const [notes, setNotes] = useState(initialTranslation.notes);
  const [message, setMessage] = useState("");

  async function editFormTranslation() {
    if(!content) {
      setMessage("Please enter text to be translated.");
      return;
    }

    const putUrl = `translations/${initialTranslation.id}`;
    const data = { content, notes };
    const result = await sendBackendJson(putUrl, 'PUT', data);
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }

    queryClient.resetQueries({ queryKey: ['translations', initialTranslation.id] });
    navigate(`/translation/${initialTranslation.id}`);
  }

  return (
    <>
      <h2>Edit Translation</h2>
      {message && <p style={{ marginBottom: "0" }}>{message}</p>}
      <TranslationInfo>
        <h4>Text:</h4>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          spellCheck={false}
          style={{ height: "10.5em" }}
        />
        <h4>Notes:</h4>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          spellCheck={false}
        />
      </TranslationInfo>
      {message && <p style={{ marginTop: "0" }}>{message}</p>}
      <div style={{ margin: "0.5em 0 1em" }}>
        <button type="button" onClick={editFormTranslation}>
          Save changes
        </button>
      </div>
      <button
        type="button"
        onClick={() => navigate('/translation/' + initialTranslation.id)}
      >
        Back
      </button>
      <h4>Delete Translation</h4>
      <p>
        <Link to={'/delete-translation/' + initialTranslation.id}>
          Delete this translation
        </Link>
      </p>
    </>
  );
}

export default function EditTranslation() {
  const { id } = useParams();
  if(!id) {
    throw new Error("No translation ID was provided");
  }

  const translationResponse = useTranslation(id);

  useSetPageTitle("Edit Translation");

  if(translationResponse.status !== 'success') {
    return renderDatalessQueryResult(translationResponse);
  }

  return <EditTranslationInner initialTranslation={translationResponse.data} />;
}
