import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

import {
  CFormBody, CIpaTextInput, CMultilineTextInput, CTextInput
} from '../components/CForm.tsx';
import LinkButton from '../components/LinkButton.tsx';
import POSAndClassesSelect from '../components/POSAndClassesSelect.tsx';

import {
  getLanguageById, getWordClassesByLanguage, ILanguage
} from '../languageData.tsx';
import {
  addWord, getPartsOfSpeech, getWordById, getWordClassIdsByWord,
  IPartOfSpeech, IWord, IWordClass
} from '../wordData.tsx';
import { useGetParamsOrSelectedId, useSetPageTitle } from '../utils.tsx';

function wordName(query: ReturnType<typeof getWordById>) {
  if(query.isPending) {
    return "Loading...";
  } else if(query.error) {
    return query.error.message;
  } else {
    return query.data.word;
  }
}

interface IWordAddedMessage { 
  prevId: string;
  copyWordData: (word: IWord, classIds: string[]) => void;
}

function WordAddedMessage({ prevId, copyWordData }: IWordAddedMessage) {
  const prevWordQuery = getWordById(prevId);
  const prevWordClassesQuery = getWordClassIdsByWord(prevId);

  function copyFields() {
    if(prevWordQuery.data && prevWordClassesQuery.data) {
      copyWordData(prevWordQuery.data, prevWordClassesQuery.data);
    }
  }
  
  return (
    <p>
      Word '
      <Link to={ '/word/' + prevId }>
        { wordName(prevWordQuery) }
      </Link>
      ' added successfully
      {
        prevWordQuery.isSuccess && (
          <>
            <br />
            <small>
              <LinkButton onClick={copyFields}>
                (copy fields)
              </LinkButton>
            </small>
          </>
        )
      }
    </p>
  );
}

interface IAddWordInner {
  language: ILanguage;
  langClasses: IWordClass[];
  langPartsOfSpeech: IPartOfSpeech[];
}

function AddWordInner({ language, langClasses, langPartsOfSpeech }: IAddWordInner) {
  const [ searchParams ] = useSearchParams();
  const navigate = useNavigate();

  const copyWordQuery = getWordById(
    searchParams.get('copy') ?? "", searchParams.has('copy')
  );
  const copyWordClassesQuery = getWordClassIdsByWord(
    searchParams.get('copy') ?? "", searchParams.has('copy')
  );
  const [ shouldCopyWord, setShouldCopyWord ] = useState(searchParams.has('copy'));
  
  const [ word, setWord ] = useState("");
  const [ meaning, setMeaning ] = useState("");
  const [ ipa, setIpa ] = useState("");
  const [ pos, setPos ] = useState("");
  const [ classes, setClasses ] = useState([] as IWordClass[]);
  const [ etymology, setEtymology ] = useState("");
  const [ notes, setNotes ] = useState("");

  const [ preserveFields, setPreserveFields ] = useState(false);
  const [ message, setMessage ] = useState("");
  const [ copyingMessage, setCopyingMessage ] = useState<ReactNode>(null);

  useEffect(() => {
    if(shouldCopyWord) {
      if(copyWordQuery.error) {
        setCopyingMessage("Could not copy word: " + copyWordQuery.error.message);
        setShouldCopyWord(false);
      } else if(copyWordClassesQuery.error) {
        setCopyingMessage("Could not copy word: " + copyWordClassesQuery.error.message);
        setShouldCopyWord(false);
      } else if(copyWordQuery.status === 'pending') {
        setCopyingMessage("Copying word...");
      } else if(copyWordClassesQuery.status === 'pending') {
        setCopyingMessage("Copying word...");
      } else {
        const copied = copyWordQuery.data;
        setShouldCopyWord(false);
        copyWordData(copied, copyWordClassesQuery.data);
        setCopyingMessage(
          <>
            Copying: <Link to={ '/words/' + copied.id }>{ copied.word }</Link>{" "}
            ({ copied.meaning })
          </>
        );
      }
    }
  }, [copyWordQuery, copyWordClassesQuery, shouldCopyWord]);
  
  function copyWordData(word: IWord, classIds: string[]) {
    setWord(word.word);
    setIpa(word.ipa);
    setMeaning(word.meaning);
    setPos(word.pos);
    setClasses(langClasses.filter(cls => classIds.includes(cls.id)));
    setEtymology(word.etymology);
    setNotes(word.notes);
  }
  
  function resetFields() {
    setWord("");
    setMeaning("");
    setIpa("");
    setPos("");
    setClasses([]);
    setEtymology("");
    setNotes("");
  }

  async function addFormWord() {
    if(!word) {
      setMessage("Please enter a word");
      return;
    }
    if(!meaning) {
      setMessage("Please enter a meaning");
      return;
    }
    if(!pos) {
      setMessage("Please choose a part of speech");
      return;
    }
    
    const result = await addWord({
      word,
      ipa,
      meaning,
      pos,
      etymology,
      notes,
      langId: language.id,
      classIds: classes.map(cls => cls.id)
    });
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }

    if(!preserveFields) {
      resetFields();
    }
    
    navigate(`/add-word/${language.id}/?prev=${result.body}`);
  }
  
  return (
    <>
      <h2>Add Word</h2>
      <p>Add a word to <Link to={ '/language/' + language.id }>{ language.name }</Link>'s dictionary.</p>
      {
        searchParams.has('prev') && (
          <WordAddedMessage
            prevId={ searchParams.get('prev')! }
            copyWordData={copyWordData}
          />
        )
      }
      { copyingMessage && <p>{copyingMessage}</p> }
      { message && <p>{message}</p> }
      <form className="chronologue-form">
        <CFormBody>
          <CTextInput label="Word" name="word" state={word} setState={setWord} />
          <CTextInput label="Meaning" name="meaning" state={meaning} setState={setMeaning} />
          <CIpaTextInput languageId={language.id} ipa={ipa} setIpa={setIpa} word={word} />
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
        <button type="button" onClick={addFormWord}>
          Add Word
        </button>
        <label style={{ margin: "10px auto 0" }}>
          <input
            type="checkbox"
            checked={preserveFields}
            onChange={ e => setPreserveFields(e.target.checked) }
          />
          Preserve fields after adding
        </label>
      </form>
    </>
  );
};

export default function AddWord() {
  /*const { selectedLanguage } = useContext(SelectedLanguageContext);
  if(selectedLanguage === null) {
    return <Navigate replace to="/add-language" state={{ mustBefore: "adding a word" }}/>;
  }*/
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }
  
  const languageResponse = getLanguageById(languageId);
  const classesResponse = getWordClassesByLanguage(languageId);
  const partsOfSpeechResponse = getPartsOfSpeech();
  
  useSetPageTitle("Add Word");

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

  if(classesResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(classesResponse.status === 'error') {
    return (
      <p>{ classesResponse.error.message }</p>
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
    <AddWordInner
      language={ languageResponse.data }
      langClasses={ classesResponse.data }
      langPartsOfSpeech={ partsOfSpeechResponse.data }
    />
  );
};
