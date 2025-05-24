import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSetPageTitle } from '@/utils/global/hooks';
import { sendBackendJson } from '@/utils/global/queries';

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
      <p style={{ marginBottom: "0" }}>Add a translation.</p>
      {message && <p><b>{message}</b></p>}
      <div className="translation-info">
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
      </div>
      {message && <p style={{ marginTop: "0" }}><b>{message}</b></p>}
      <div style={{ marginTop: "0.5em" }}>
        <button type="button" onClick={addFormTranslation}>
          Add Translation
        </button>
      </div>
    </>
  );
}
