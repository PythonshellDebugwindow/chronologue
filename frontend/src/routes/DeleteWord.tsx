import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useWord } from '@/hooks/words';

import { IWord } from '@/types/words';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendRequest } from '@/utils/global/queries';

function DeleteWordInner({ word }: { word: IWord }) {
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState("");

  async function deleteFormWord() {
    const result = await sendBackendRequest(`words/${word.id}`, 'DELETE');
    if(!result.ok) {
      setErrorMessage(result.body.message);
      return;
    }

    navigate('/dictionary');
  }

  return (
    <>
      <h2>Delete Word</h2>
      <p>
        Really delete word <Link to={'/word/' + word.id}>{word.word}</Link> ({word.meaning})?
      </p>
      <p>
        <b>This action cannot be undone!</b>
      </p>
      <button onClick={deleteFormWord} style={{ marginBottom: "15px" }}>
        Delete word
      </button>
      <br />
      <button onClick={() => navigate(-1)}>
        Go back
      </button>
      {errorMessage && <p><b>Error: {errorMessage}</b></p>}
    </>
  );
}

export default function DeleteWord() {
  const { id: wordId } = useParams();
  if(!wordId) {
    throw new Error("No word ID was provided");
  }

  const wordResponse = useWord(wordId);

  useSetPageTitle("Delete Word");

  if(wordResponse.status !== 'success') {
    return renderDatalessQueryResult(wordResponse);
  }

  return <DeleteWordInner word={wordResponse.data} />;
};
