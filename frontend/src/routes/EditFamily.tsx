import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { CFormBody, CMultilineTextInput, CTextInput } from '../components/CForm.tsx';

import { useFamily } from '@/hooks/families';

import { IFamily } from '@/types/families';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

function EditFamilyInner({ initialFamily }: { initialFamily: IFamily }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(initialFamily.name);
  const [description, setDescription] = useState(initialFamily.description);
  const [errorMessage, setErrorMessage] = useState("");

  async function editFormFamily() {
    if(!name) {
      setErrorMessage("Please enter a name");
      return;
    }

    const data = { name, description };
    const result = await sendBackendJson(`families/${initialFamily.id}`, 'PUT', data);
    if(!result.ok) {
      setErrorMessage(result.body.message);
      return;
    }

    queryClient.resetQueries({ queryKey: ['families', initialFamily.id] });
    navigate(`/family/${initialFamily.id}`);
  }

  return (
    <>
      <h2>Edit Family</h2>
      {errorMessage && <p>{errorMessage}</p>}
      <form className="chronologue-form">
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
        <button type="button" onClick={editFormFamily}>
          Save changes
        </button>
        <button type="button" onClick={() => navigate('/family/' + initialFamily.id)}>
          Back
        </button>
      </form>
      <h4>Delete Family</h4>
      <p>
        <Link to={'/delete-family/' + initialFamily.id}>
          Delete {initialFamily.name}
        </Link>
      </p>
    </>
  );
}

export default function EditFamily() {
  const { id: familyId } = useParams();
  if(!familyId) {
    throw new Error("No family ID was provided");
  }

  const familyResponse = useFamily(familyId);

  useSetPageTitle("Edit Family");

  if(familyResponse.status !== 'success') {
    return renderDatalessQueryResult(familyResponse);
  }

  return <EditFamilyInner initialFamily={familyResponse.data} />;
};
