import { useContext, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { deleteLanguage, getLanguageById, ILanguage } from '../languageData.tsx';
import SelectedLanguageContext from '../SelectedLanguageContext.tsx';
import { useSetPageTitle } from '../utils.tsx';

function DeleteLanguageInner({ language }: { language: ILanguage }) {
  const navigate = useNavigate();
  
  const { selectedLanguage, setSelectedLanguage } = useContext(SelectedLanguageContext);

  const [ errorMessage, setErrorMessage ] = useState("");
  
  async function deleteFormLanguage() {
    const result = await deleteLanguage(language.id);
    if(!result.ok) {
      setErrorMessage(result.body.message);
      return;
    }
    
    navigate("/languages");
    if(selectedLanguage?.id === language.id) {
      setSelectedLanguage(null);
    }
  }
  
  return (
    <>
      <h2>Delete Language</h2>
      <p>
        Really delete <Link to={ '/language/' + language.id }>{ language.name }</Link> and all its data?
      </p>
      <p>
        <b>This action cannot be undone!</b>
      </p>
      <button
        style={{ marginBottom: "15px" }}
        onClick={ e => { deleteFormLanguage(); e.preventDefault(); return false; } }
      >
        Delete language
      </button>
      <br />
      <button onClick={ e => { navigate(-1); e.preventDefault(); return false; }}>
        Go back
      </button>
      { errorMessage && <p><b>Error: {errorMessage}</b></p> }
    </>
  );
};

export default function DeleteLanguage() {
  const { id: languageId } = useParams();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }
  
  const languageResponse = getLanguageById(languageId);
  
  useSetPageTitle("Delete Language");

  if(languageResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(languageResponse.status === 'error') {
    return (
      <>
        <h2>{ languageResponse.error.title }</h2>
        <p>{ languageResponse.error.message }</p>
      </>
    );
  }

  return <DeleteLanguageInner language={ languageResponse.data } />;
};
