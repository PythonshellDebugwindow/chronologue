import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useFamily } from '@/hooks/families';

import { IFamily } from '@/types/families';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendRequest } from '@/utils/global/queries';

function DeleteFamilyInner({ family }: { family: IFamily }) {
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState("");

  async function deleteFormFamily() {
    const result = await sendBackendRequest(`families/${family.id}`, 'DELETE');
    if(!result.ok) {
      setErrorMessage(result.body.message);
      return;
    }

    navigate('/languages');
  }

  return (
    <>
      <h2>Delete Family</h2>
      <p>
        Really delete <Link to={'/family/' + family.id}>{family.name}</Link>?
      </p>
      <p>
        <b>This action cannot be undone!</b>
      </p>
      <button onClick={deleteFormFamily} style={{ marginBottom: "15px" }}>
        Delete family
      </button>
      <br />
      <button onClick={() => navigate(-1)}>
        Go back
      </button>
      {errorMessage && <p><b>Error: {errorMessage}</b></p>}
    </>
  );
}

export default function DeleteFamily() {
  const { id: familyId } = useParams();
  if(!familyId) {
    throw new Error("No family ID was provided");
  }

  const familyResponse = useFamily(familyId);

  useSetPageTitle("Delete Family");

  if(familyResponse.status !== 'success') {
    return renderDatalessQueryResult(familyResponse);
  }

  return <DeleteFamilyInner family={familyResponse.data} />;
}
