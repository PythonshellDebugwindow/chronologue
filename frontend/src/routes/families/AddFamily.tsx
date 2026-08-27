import { useState } from 'react';
import { useNavigate } from 'react-router';

import { CForm, CFormBody, CMultilineTextInput, CTextInput } from '@/components/CForm';

import { useSetPageTitle } from '@/utils/global/hooks';
import { sendBackendJson } from '@/utils/global/queries';

export default function AddFamily() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  useSetPageTitle("Add Family");

  async function addFormFamily() {
    if(!name) {
      setMessage("Please enter a family name.");
      return;
    }

    const result = await sendBackendJson('families', 'POST', { name, description });
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }

    navigate('/family/' + result.body);
  }

  return (
    <>
      <h2>Add Family</h2>
      <p>Add a language family.</p>
      {message && <p><b>{message}</b></p>}
      <CForm>
        <CFormBody>
          <CTextInput
            label="Name"
            name="name"
            state={name}
            setState={setName}
          />
          <CMultilineTextInput
            label="Description"
            name="description"
            state={description}
            setState={setDescription}
          />
        </CFormBody>
        <button type="button" onClick={addFormFamily}>
          Add Family
        </button>
      </CForm>
    </>
  );
}
