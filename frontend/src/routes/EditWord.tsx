import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import {
  CFormBody, CIpaTextInput, CMultilineTextInput, CTextInput
} from '../components/CForm.tsx';
import POSAndClassesSelect from '../components/POSAndClassesSelect.tsx';

import {
  useLanguageDictionarySettings, useLanguageWordClasses, IDictionarySettings
} from '../languageData.tsx';
import { renderDatalessQueryResult, useSetPageTitle } from '../utils.tsx';
import {
  editWord, usePartsOfSpeech, useWord, useWordClassIds,
  IPartOfSpeech, IWord, IWordClass
} from '../wordData.tsx';

interface IAddWordInner {
  initialWord: IWord;
  initialClassIds: string[];
  dictSettings: IDictionarySettings;
  langClasses: IWordClass[];
  partsOfSpeech: IPartOfSpeech[];
}

function EditWordInner(
  { initialWord, initialClassIds, dictSettings, langClasses, partsOfSpeech }: IAddWordInner
) {
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
          <CTextInput
            label="Word"
            name="word"
            state={word}
            setState={setWord}
          />
          <CTextInput
            label="Meaning"
            name="meaning"
            state={meaning}
            setState={setMeaning}
          />
          {
            dictSettings.showWordIpa && (
              <CIpaTextInput
                languageId={ initialWord.langId }
                word={word}
                ipa={ipa}
                setIpa={setIpa}
              />
            )
          }
          <POSAndClassesSelect
            pos={pos}
            setPos={setPos}
            allLangPos={partsOfSpeech}
            classes={classes}
            setClasses={setClasses}
            allLangClasses={langClasses}
          />
          <CMultilineTextInput
            label="Etymology"
            name="etymology"
            state={etymology}
            setState={setEtymology}
          />
          <CMultilineTextInput
            label="Notes"
            name="notes"
            state={notes}
            setState={setNotes}
          />
        </CFormBody>
        <button type="button" onClick={editFormWord}>
          Save
        </button>
      </form>
    </>
  );
};

function EditWordWithWord({ word }: { word: IWord }) {
  const wordClassIdsResponse = useWordClassIds(word.id);
  const dictSettingsResponse = useLanguageDictionarySettings(word.langId);
  const languageClassesResponse = useLanguageWordClasses(word.langId);
  const partsOfSpeechResponse = usePartsOfSpeech();

  if(wordClassIdsResponse.status !== 'success') {
    return renderDatalessQueryResult(wordClassIdsResponse);
  }
  
  if(dictSettingsResponse.status !== 'success') {
    return renderDatalessQueryResult(dictSettingsResponse);
  }

  if(languageClassesResponse.status !== 'success') {
    return renderDatalessQueryResult(languageClassesResponse);
  }
  
  if(partsOfSpeechResponse.status !== 'success') {
    return renderDatalessQueryResult(partsOfSpeechResponse);
  }
  
  return (
    <EditWordInner
      initialWord={word}
      initialClassIds={ wordClassIdsResponse.data }
      dictSettings={ dictSettingsResponse.data }
      langClasses={ languageClassesResponse.data }
      partsOfSpeech={ partsOfSpeechResponse.data }
    />
  );
}

export default function EditWord() {
  const { id: wordId } = useParams();
  if(!wordId) {
    throw new Error("No word ID was provided");
  }
  
  const wordResponse = useWord(wordId);
  
  useSetPageTitle("Edit Word");

  if(wordResponse.status !== 'success') {
    return renderDatalessQueryResult(wordResponse);
  }

  return <EditWordWithWord word={ wordResponse.data } />;
};
