import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { ILanguage, useLanguage } from '../languageData.tsx';
import { renderDatalessQueryResult, useGetParamsOrSelectedId, useSetPageTitle } from '../utils.tsx';
import { purgeDictionary } from '../wordData.tsx';

function PurgeDictionaryInner({ language }: { language: ILanguage }) {
  const navigate = useNavigate();

  const [ errorMessage, setErrorMessage ] = useState("");
  
  async function confirmPurgeDictionary() {
    const result = await purgeDictionary(language.id);
    if(!result.ok) {
      setErrorMessage(result.body.message);
      return;
    }
    
    navigate(`/dictionary/${language.id}`);
  }

  return (
    <>
      <h2>Purge Dictionary</h2>
      <p>
        Purging <Link to={ '/language/' + language.id }>{ language.name }</Link>'s dictionary.
      </p>
      <p className="grammar-table-paragraph">
        This action will <b>irreversibly</b> delete all words you've added so far.
        Please ensure you have made a backup of any important data before proceeding.
      </p>
      <p>
        Are you sure you want to go through with this?
      </p>
      { errorMessage && <p><b>{errorMessage}</b></p> }
      <p>
        <button onClick={confirmPurgeDictionary}>
          Purge all words!
        </button>
      </p>
      <p>
        <button onClick={ () => navigate(-1) }>
          Don't purge!
        </button>
      </p>
    </>
  );
};

export default function PurgeDictionary() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }
  
  const languageResponse = useLanguage(id);
  
  useSetPageTitle("Purge Dictionary");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  return <PurgeDictionaryInner language={ languageResponse.data } />;
};
