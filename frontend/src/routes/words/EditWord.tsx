import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import {
  CForm,
  CFormBody,
  CIpaTextInput,
  CMultilineTextInput,
  CTextInput,
  CTextInputWithAlphabet
} from '@/components/CForm';
import IrregularWordStemsEdit from '@/components/IrregularWordStemsEdit';
import POSAndClassesSelect from '@/components/POSAndClassesSelect';

import {
  useLanguageDictionarySettings,
  useLanguageWordClasses
} from '@/hooks/languages';
import { usePartsOfSpeech, useWord, useWordClassIds } from '@/hooks/words';

import { IrregularWordStems } from '@/types/grammar';
import { IDictionarySettings } from '@/types/languages';
import { IPartOfSpeech, IWord, IWordClass } from '@/types/words';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

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

  const [word, setWord] = useState(initialWord.word);
  const [meaning, setMeaning] = useState(initialWord.meaning);
  const [ipa, setIpa] = useState(initialWord.ipa);
  const [pos, setPos] = useState(initialWord.pos);
  const [classes, setClasses] = useState(
    langClasses.filter(cls => initialClassIds.includes(cls.id))
  );
  const [etymology, setEtymology] = useState(initialWord.etymology);
  const [notes, setNotes] = useState(initialWord.notes);
  const [irregularStems, setIrregularStems] = useState<IrregularWordStems | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

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

    const data = {
      word,
      ipa,
      meaning,
      pos,
      etymology,
      notes,
      langId: initialWord.langId,
      classIds: classes.map(cls => cls.id),
      irregularStems
    };
    const result = await sendBackendJson(`words/${initialWord.id}`, 'PUT', data);
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
      {errorMessage && <p>{errorMessage}</p>}
      <CForm>
        <CFormBody>
          <CTextInputWithAlphabet
            langId={initialWord.langId}
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
          {(dictSettings.showWordIpa || initialWord.ipa) && (
            <CIpaTextInput
              languageId={initialWord.langId}
              word={word}
              ipa={ipa}
              setIpa={setIpa}
            />
          )}
          <POSAndClassesSelect
            pos={pos}
            setPos={pos => { setPos(pos); setIrregularStems(null); }}
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
        {dictSettings.canEditIrregularStems && (
          <IrregularWordStemsEdit
            wordId={initialWord.id}
            langId={initialWord.langId}
            pos={pos}
            irregularStems={irregularStems}
            setIrregularStems={setIrregularStems}
          />
        )}
        <button type="button" onClick={editFormWord}>
          Save changes
        </button>
        <button type="button" onClick={() => navigate('/word/' + initialWord.id)}>
          Back
        </button>
      </CForm>
    </>
  );
}

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
      initialClassIds={wordClassIdsResponse.data}
      dictSettings={dictSettingsResponse.data}
      langClasses={languageClassesResponse.data}
      partsOfSpeech={partsOfSpeechResponse.data}
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

  return <EditWordWithWord word={wordResponse.data} />;
}
