import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

import { CFormBody, CMultilineTextInput, CTextInput } from '../components/CForm.tsx';

import { editFamily, getFamilyById, IFamily } from '../familyData.tsx';
import { useSetPageTitle } from '../utils.tsx';

function EditFamilyInner({ initialFamily }: { initialFamily: IFamily }) {
  const navigate = useNavigate();

  const [ name, setName ] = useState(initialFamily.name);
  const [ description, setDescription ] = useState(initialFamily.description);
  const [ errorMessage, setErrorMessage ] = useState("");
  
  async function editFormFamily() {
    if(!name) {
      setErrorMessage("Please enter a name");
      return;
    }

    const result = await editFamily(initialFamily.id, {
      name,
      description
    });
    if(!result.ok) {
      setErrorMessage(result.body.message);
      return;
    }
    
    navigate(`/family/${initialFamily.id}`);
  }

  return (
    <>
      <h2>Edit Family</h2>
      { errorMessage && <p>{errorMessage}</p> }
      <form className="chronologue-form">
        <CFormBody>
          <CTextInput label="Name" name="name" state={name} setState={setName} />
          <CMultilineTextInput label="Description" name="description" state={description} setState={setDescription} />
        </CFormBody>
        <button
          type="button"
          onClick={ e => { editFormFamily(); e.preventDefault(); return false; }}
        >
          Save
        </button>
      </form>
      <h4>Delete Family</h4>
      <p>
        <Link to={ '/delete-family/' + initialFamily.id }>
          Delete { initialFamily.name }
        </Link>
      </p>
    </>
  )
};

export default function EditFamily() {
  const { id: familyId } = useParams();
  if(!familyId) {
    throw new Error("No family ID was provided");
  }
  
  const familyResponse = getFamilyById(familyId);
  
  useSetPageTitle("Edit Family");

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

  return <EditFamilyInner initialFamily={ familyResponse.data } />;
};
