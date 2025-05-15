import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { CFormBody, CMultilineTextInput } from '../components/CForm.tsx';

import { ITranslation, useTranslation } from '../translationData.tsx';
import { renderDatalessQueryResult, sendBackendJson, useSetPageTitle } from '../utils.tsx';

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
      {message && <p>{message}</p>}
      <form className="chronologue-form">
        <CFormBody>
          <CMultilineTextInput
            label="Content"
            name="content"
            state={content}
            setState={setContent}
          />
          <CMultilineTextInput
            label="Notes"
            name="notes"
            state={notes}
            setState={setNotes}
            height="5em"
          />
        </CFormBody>
        <button type="button" onClick={editFormTranslation}>
          Save changes
        </button>
        <button
          type="button"
          onClick={() => navigate('/translation/' + initialTranslation.id)}
        >
          Back
        </button>
      </form>
      <h4>Delete Translation</h4>
      <p>
        <Link to={'/delete-translation/' + initialTranslation.id}>
          Delete
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
};
