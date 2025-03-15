import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useSetPageTitle } from '../utils.tsx';
import { deleteFamily, getFamilyById, IFamily } from '../familyData.tsx';

function DeleteFamilyInner({ family }: { family: IFamily }) {
  const navigate = useNavigate();

  const [ errorMessage, setErrorMessage ] = useState("");
  
  async function deleteFormFamily() {
    const result = await deleteFamily(family.id);
    if(!result.ok) {
      setErrorMessage(result.body.message);
      return;
    }
    
    navigate("/languages");
  }
  
  return (
    <>
      <h2>Delete Family</h2>
      <p>
        Really delete <Link to={ '/family/' + family.id }>{ family.name }</Link>?
      </p>
      <p>
        <b>This action cannot be undone!</b>
      </p>
      <button
        style={{ marginBottom: "15px" }}
        onClick={deleteFormFamily}
      >
        Delete family
      </button>
      <br />
      <button onClick={ () => navigate(-1) }>
        Go back
      </button>
      { errorMessage && <p><b>Error: {errorMessage}</b></p> }
    </>
  );
};

export default function DeleteFamily() {
  const { id: familyId } = useParams();
  if(!familyId) {
    throw new Error("No family ID was provided");
  }
  
  const familyResponse = getFamilyById(familyId);
  
  useSetPageTitle("Delete Family");

  if(familyResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(familyResponse.status === 'error') {
    return (
      <>
        <h2>{ familyResponse.error.title }</h2>
        <p>{ familyResponse.error.message }</p>
      </>
    );
  }

  return <DeleteFamilyInner family={ familyResponse.data } />;
};
