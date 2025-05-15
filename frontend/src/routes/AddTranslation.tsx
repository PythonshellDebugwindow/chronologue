import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CFormBody, CMultilineTextInput } from '../components/CForm.tsx';

import { sendBackendJson, useSetPageTitle } from '../utils.tsx';

export default function AddTranslation() {
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  useSetPageTitle("Add Translation");

  async function addFormTranslation() {
    if(!content) {
      setMessage("Please enter text to be translated.");
      return;
    }

    const data = { content, notes };
    const result = await sendBackendJson('translations', 'POST', data);
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }

    navigate('/translation/' + result.body);
  }

  return (
    <>
      <h2>Add Translation</h2>
      <p>Add a translation.</p>
      {message && <p><b>{message}</b></p>}
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
        <button type="button" onClick={addFormTranslation}>
          Add Translation
        </button>
      </form>
    </>
  );
};
