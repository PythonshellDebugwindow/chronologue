import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { deleteWord, getWordById, IWord } from '../wordData.tsx';
import { useSetPageTitle } from '../utils.tsx';

function DeleteWordInner({ word }: { word: IWord }) {
  const navigate = useNavigate();

  const [ errorMessage, setErrorMessage ] = useState("");
  
  async function deleteFormWord() {
    const result = await deleteWord(word.id);
    if(!result.ok) {
      setErrorMessage(result.body.message);
      return;
    }
    
    navigate("/dictionary");
  }
  
  return (
    <>
      <h2>Delete Word</h2>
      <p>
        Really delete word <Link to={ '/word/' + word.id }>{ word.word }</Link> ({ word.meaning })?
      </p>
      <p>
        <b>This action cannot be undone!</b>
      </p>
      <button
        style={{ marginBottom: "15px" }}
        onClick={deleteFormWord}
      >
        Delete word
      </button>
      <br />
      <button onClick={ () => navigate(-1) }>
        Go back
      </button>
      { errorMessage && <p><b>Error: {errorMessage}</b></p> }
    </>
  );
};

export default function DeleteWord() {
  const { id: wordId } = useParams();
  if(!wordId) {
    throw new Error("No word ID was provided");
  }
  
  const wordResponse = getWordById(wordId);
  
  useSetPageTitle("Delete Word");

  if(wordResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(wordResponse.status === 'error') {
    return (
      <>
        <h2>{ wordResponse.error.title }</h2>
        <p>{ wordResponse.error.message }</p>
      </>
    );
  }

  return <DeleteWordInner word={ wordResponse.data } />;
};
