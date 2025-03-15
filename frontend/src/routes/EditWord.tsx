import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import {
  CFormBody, CIpaTextInput, CMultilineTextInput, CTextInput
} from '../components/CForm.tsx';
import POSAndClassesSelect from '../components/POSAndClassesSelect.tsx';

import { getWordClassesByLanguage } from '../languageData.tsx';
import {
  editWord, getPartsOfSpeech, getWordById, getWordClassIdsByWord,
  IPartOfSpeech, IWord, IWordClass
} from '../wordData.tsx';
import { useSetPageTitle } from '../utils.tsx';

interface IAddWordInner {
  initialWord: IWord;
  initialClassIds: string[];
  langClasses: IWordClass[];
  langPartsOfSpeech: IPartOfSpeech[];
}

function EditWordInner({ initialWord, initialClassIds, langClasses, langPartsOfSpeech }: IAddWordInner) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [ word, setWord ] = useState(initialWord.word);
  const [ meaning, setMeaning ] = useState(initialWord.meaning);
  const [ ipa, setIpa ] = useState(initialWord.ipa);
  const [ pos, setPos ] = useState(initialWord.pos);
  const [ classes, setClasses ] = useState(
    langClasses.filter(cls => initialClassIds.includes(cls.id))
  );
  const [ etymology, setEtymology ] = useState(initialWord.etymology);
  const [ notes, setNotes ] = useState(initialWord.notes);
  const [ errorMessage, setErrorMessage ] = useState("");
  
  async function editFormWord() {
    if(!word) {
      setErrorMessage("Please enter a word");
      return;
    }
    if(!meaning) {
      setErrorMessage("Please enter a meaning");
      return;
    }
    if(!pos) {
      setErrorMessage("Please choose a part of speech");
      return;
    }

    const result = await editWord(initialWord.id, {
      word,
      ipa,
      meaning,
      pos,
      etymology,
      notes,
      langId: initialWord.langId,
      classIds: classes.map(cls => cls.id)
    });
    if(!result.ok) {
      setErrorMessage(result.body.message);
      return;
    }
    
    queryClient.resetQueries({ queryKey: ['words', initialWord.id] });
    navigate(`/word/${initialWord.id}`);
  }
  
  return (
    <>
      <h2>Edit Word</h2>
      { errorMessage && <p>{errorMessage}</p> }
      <form className="chronologue-form">
        <CFormBody>
          <CTextInput label="Word" name="word" state={word} setState={setWord} />
          <CTextInput label="Meaning" name="meaning" state={meaning} setState={setMeaning} />
          <CIpaTextInput languageId={ initialWord.langId } word={word} ipa={ipa} setIpa={setIpa} />
          <POSAndClassesSelect
            pos={pos}
            setPos={setPos}
            allLangPos={langPartsOfSpeech}
            classes={classes}
            setClasses={setClasses}
            allLangClasses={langClasses}
          />
          <CMultilineTextInput label="Etymology" name="etymology" state={etymology} setState={setEtymology} />
          <CMultilineTextInput label="Notes" name="notes" state={notes} setState={setNotes} />
        </CFormBody>
        <button type="button" onClick={editFormWord}>
          Save
        </button>
      </form>
    </>
  );
};

function EditWordWithWord({ word }: { word: IWord }) {
  const wordClassIdsResponse = getWordClassIdsByWord(word.id);
  const languageClassesResponse = getWordClassesByLanguage(word.langId);
  const partsOfSpeechResponse = getPartsOfSpeech();

  if(wordClassIdsResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(wordClassIdsResponse.status === 'error') {
    return (
      <p>{ wordClassIdsResponse.error.message }</p>
    );
  }

  if(languageClassesResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(languageClassesResponse.status === 'error') {
    return (
      <p>{ languageClassesResponse.error.message }</p>
    );
  }
  
  if(partsOfSpeechResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(partsOfSpeechResponse.status === 'error') {
    return (
      <p>{ partsOfSpeechResponse.error.message }</p>
    );
  }
  
  return (
    <EditWordInner
      initialWord={word}
      initialClassIds={ wordClassIdsResponse.data }
      langClasses={ languageClassesResponse.data }
      langPartsOfSpeech={ partsOfSpeechResponse.data }
    />
  );
}

export default function EditWord() {
  const { id: wordId } = useParams();
  if(!wordId) {
    throw new Error("No word ID was provided");
  }
  
  const wordResponse = getWordById(wordId);
  
  useSetPageTitle("Edit Word");

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

  return <EditWordWithWord word={ wordResponse.data } />;
};
