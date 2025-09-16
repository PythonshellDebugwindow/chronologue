import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import {
  CForm,
  CFormBody,
  CIpaTextInput,
  CMultilineTextInput,
  CNewWordInput,
  CNewWordMeaningInput
} from '@/components/CForm';
import IrregularWordStemsEdit from '@/components/IrregularWordStemsEdit';
import LanguageLink from '@/components/LanguageLink';
import LinkButton from '@/components/LinkButton';
import POSAndClassesSelect from '@/components/POSAndClassesSelect';

import {
  useLanguage,
  useLanguageDictionarySettings,
  useLanguageWordClasses,
  useLanguageWordDerivationForDictionary
} from '@/hooks/languages';
import {
  usePartsOfSpeech,
  useWord,
  useWordClassIds,
  useWordDerivationIntoLanguage
} from '@/hooks/words';

import { IrregularWordStems } from '@/types/grammar';
import { IDictionarySettings, ILanguage } from '@/types/languages';
import { IPartOfSpeech, IWord, IWordClass } from '@/types/words';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

function wordName(query: ReturnType<typeof useWord>) {
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
  const prevWordQuery = useWord(prevId);
  const prevWordClassesQuery = useWordClassIds(prevId);

  function copyFields() {
    if(prevWordQuery.data && prevWordClassesQuery.data) {
      copyWordData(prevWordQuery.data, prevWordClassesQuery.data);
    }
  }

  return (
    <p>
      Word '
      <Link to={'/word/' + prevId}>
        {wordName(prevWordQuery)}
      </Link>
      ' added successfully
      {prevWordQuery.isSuccess && (
        <>
          <br />
          <small>
            <LinkButton onClick={copyFields}>
              [copy fields]
            </LinkButton>
          </small>
        </>
      )}
    </p>
  );
}

interface IAddWordInner {
  language: ILanguage;
  dictSettings: IDictionarySettings;
  langClasses: IWordClass[];
  langPartsOfSpeech: IPartOfSpeech[];
}

function AddWordInner({ language, dictSettings, langClasses, langPartsOfSpeech }: IAddWordInner) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const wordIdToCopy = searchParams.get('copy') ?? searchParams.get('derive');
  const hasCopyOrDeriveParam = !!wordIdToCopy;
  const hasCopyParam = !!searchParams.get('copy');

  const isDerivingDictionary = searchParams.has('deriveDict');
  const dictDerivationLangId = searchParams.get('deriveDict');

  const copyWordQuery = useWord(wordIdToCopy ?? "", hasCopyOrDeriveParam);
  const copyWordClassesQuery = useWordClassIds(wordIdToCopy ?? "", hasCopyParam);
  const [shouldCopyWord, setShouldCopyWord] = useState(hasCopyOrDeriveParam || isDerivingDictionary);

  const hasDeriveParam = !!searchParams.get('derive') || isDerivingDictionary;
  const deriveWordQuery = useWordDerivationIntoLanguage(
    searchParams.get('derive') ?? "", language.id, !!searchParams.get('derive')
  );

  const deriveWordForDictionaryQuery = useLanguageWordDerivationForDictionary(
    searchParams.get('prevDerive'), dictDerivationLangId, language.id, isDerivingDictionary
  );

  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [ipa, setIpa] = useState("");
  const [pos, setPos] = useState("");
  const [classes, setClasses] = useState<IWordClass[]>([]);
  const [etymology, setEtymology] = useState("");
  const [notes, setNotes] = useState("");
  const [irregularStems, setIrregularStems] = useState<IrregularWordStems | null>(null);

  const [preserveFields, setPreserveFields] = useState(false);
  const [message, setMessage] = useState("");
  const [copyingMessage, setCopyingMessage] = useState<ReactNode>(null);
  const [prevDictDerivationId, setPrevDictDerivationId] = useState<string | null>(null);

  type IWordToCopy = Omit<IWord, 'id' | 'created' | 'updated'>;

  const copyWordData = useCallback((word: IWordToCopy, classIds: string[]) => {
    setWord(word.word);
    setIpa(word.ipa);
    setMeaning(word.meaning);
    setPos(word.pos);
    setClasses(langClasses.filter(cls => classIds.includes(cls.id)));
    setEtymology(word.etymology);
    setNotes(word.notes);
  }, [langClasses]);

  useEffect(() => {
    setShouldCopyWord(true);
    setCopyingMessage(null);
  }, [searchParams]);

  useEffect(() => {
    if(shouldCopyWord) {
      const pendingMessage = `${hasDeriveParam ? "Deriv" : "Copy"}ing word...`;
      const couldNot = `Could not ${hasDeriveParam ? "derive" : "copy"} word: `;
      if(isDerivingDictionary) {
        if(deriveWordForDictionaryQuery.error) {
          setCopyingMessage(<b>{couldNot + deriveWordForDictionaryQuery.error.message}</b>);
          setShouldCopyWord(false);
        } else if(deriveWordForDictionaryQuery.status === 'pending') {
          setCopyingMessage(pendingMessage);
        } else if(deriveWordForDictionaryQuery.data === null) {
          if(dictDerivationLangId) {
            setCopyingMessage(
              <>
                There are no words in the given dictionary.
                <small>
                  <br />
                  Mass-deriving from <LanguageLink id={dictDerivationLangId} />'s dictionary.
                </small>
              </>
            );
          } else {
            setCopyingMessage(null);
          }
          setShouldCopyWord(false);
        } else {
          const derived = deriveWordForDictionaryQuery.data;
          const derivedWord = derived.derived;
          const newWord = {
            ...derived,
            word: derivedWord ? (derivedWord.success ? derivedWord.result : "") : derived.originalWord,
            ipa: "",
            etymology: `@D(${derived.originalId})`
          };
          setShouldCopyWord(false);
          copyWordData(newWord, []);
          setCopyingMessage(
            <>
              Deriving from:{" "}
              <Link to={'/word/' + derived.originalId}>
                {derived.originalWord}
              </Link>
              {" "}({derived.meaning})
              <small>
                <br />
                {derivedWord === null && "No ruleset found "}
                <Link to={`/derivation-rules/${language.id}?src=${derived.langId}`}>
                  [{derivedWord ? "edit" : "add"} ruleset]
                </Link>
                <br />
                Mass-deriving from <LanguageLink id={derived.langId} />'s dictionary.{" "}
                <LinkButton onClick={() => {
                  const prev = searchParams.has('prev') ? `prev=${searchParams.get('prev')}&` : '';
                  navigate(`?${prev}prevDerive=${derived.originalId}&deriveDict`);
                  setShouldCopyWord(true);
                }}>
                  [skip this word]
                </LinkButton>
              </small>
            </>
          );
          if(derivedWord?.success === false) {
            setMessage("Derivation ruleset error: " + derivedWord.message);
          }
          setPrevDictDerivationId(derived.originalId);
        }
        return;
      }
      if(copyWordQuery.error) {
        setCopyingMessage(<b>{couldNot + copyWordQuery.error.message}</b>);
        setShouldCopyWord(false);
      } else if(hasCopyParam && copyWordClassesQuery.error) {
        setCopyingMessage(<b>{couldNot + copyWordClassesQuery.error.message}</b>);
        setShouldCopyWord(false);
      } else if(hasDeriveParam && deriveWordQuery.error) {
        setCopyingMessage(<b>{couldNot + deriveWordQuery.error.message}</b>);
        setShouldCopyWord(false);
      } else if(copyWordQuery.status === 'pending') {
        setCopyingMessage(hasCopyOrDeriveParam && pendingMessage);
      } else if(hasCopyParam && copyWordClassesQuery.status === 'pending') {
        setCopyingMessage(pendingMessage);
      } else if(hasDeriveParam && deriveWordQuery.status === 'pending') {
        setCopyingMessage(pendingMessage);
      } else {
        const derived = deriveWordQuery.data?.derived;
        const copied = copyWordQuery.data;
        const newWord = {
          ...copied,
          word: derived ? (derived.success ? derived.result : "") : copied.word,
          ipa: derived ? "" : copied.ipa,
          etymology: hasDeriveParam ? `@D(${copied.id})` : copied.etymology
        };
        setShouldCopyWord(false);
        copyWordData(newWord, copyWordClassesQuery.data ?? []);
        setCopyingMessage(
          <>
            {hasDeriveParam ? "Deriving from" : "Copying"}:{" "}
            <Link to={'/word/' + copied.id}>{copied.word}</Link>{" "}
            ({copied.meaning})
            {hasDeriveParam && (
              <small>
                <br />
                {derived === null && "No ruleset found "}
                <Link to={`/derivation-rules/${language.id}?src=${copied.langId}`}>
                  [{derived ? "edit" : "add"} ruleset]
                </Link>
              </small>
            )}
          </>
        );
        if(derived?.success === false) {
          setMessage("Derivation ruleset error: " + derived.message);
        }
      }
    }
  }, [
    copyWordClassesQuery, copyWordData, copyWordQuery, deriveWordForDictionaryQuery,
    deriveWordQuery, dictDerivationLangId, hasCopyParam, hasDeriveParam,
    isDerivingDictionary, language.id, navigate, searchParams, shouldCopyWord
  ]);

  function resetFields() {
    setWord("");
    setMeaning("");
    setIpa("");
    setPos("");
    setClasses([]);
    setEtymology("");
    setNotes("");
    setCopyingMessage(null);
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

    const data = {
      word,
      ipa,
      meaning,
      pos,
      etymology,
      notes,
      langId: language.id,
      classIds: classes.map(cls => cls.id),
      irregularStems
    };
    const result = await sendBackendJson('words', 'POST', data);
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }

    if(!preserveFields) {
      resetFields();
    }

    const dictDerivationParams = (
      isDerivingDictionary ? `&prevDerive=${prevDictDerivationId ?? ""}&deriveDict` : ""
    );
    if(isDerivingDictionary) {
      setShouldCopyWord(true);
    }
    navigate(`/add-word/${language.id}/?prev=${result.body}${dictDerivationParams}`);
  }

  return (
    <>
      <h2>Add Word</h2>
      <p>
        Add a word to{" "}
        <Link to={'/language/' + language.id}>{language.name}</Link>'s dictionary.
      </p>
      {searchParams.get('prev') && (
        <WordAddedMessage
          prevId={searchParams.get('prev')!}
          copyWordData={copyWordData}
        />
      )}
      {copyingMessage && <p>{copyingMessage}</p>}
      {message && <p>{message}</p>}
      <CForm>
        <CFormBody>
          <CNewWordInput
            langId={language.id}
            label="Word"
            name="word"
            state={word}
            setState={setWord}
          />
          <CNewWordMeaningInput
            langId={language.id}
            label="Meaning"
            name="meaning"
            state={meaning}
            setState={setMeaning}
          />
          {dictSettings.showWordIpa && (
            <CIpaTextInput
              languageId={language.id}
              ipa={ipa}
              setIpa={setIpa}
              word={word}
            />
          )}
          <POSAndClassesSelect
            pos={pos}
            setPos={setPos}
            allLangPos={langPartsOfSpeech}
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
        {dictSettings.canEditIrregularStems && pos && (
          <IrregularWordStemsEdit
            langId={language.id}
            pos={pos}
            irregularStems={irregularStems}
            setIrregularStems={setIrregularStems}
          />
        )}
        <button type="button" onClick={addFormWord}>
          Add Word
        </button>
        <label style={{ margin: "10px auto 0" }}>
          <input
            type="checkbox"
            checked={preserveFields}
            onChange={e => setPreserveFields(e.target.checked)}
          />
          Preserve fields after adding
        </label>
      </CForm>
    </>
  );
}

export default function AddWord() {
  /*const { selectedLanguage } = useContext(SelectedLanguageContext);
  if(selectedLanguage === null) {
    return <Navigate replace to="/add-language" state={{ mustBefore: "adding a word" }}/>;
    // No Language Selected - Please create or select a language before ...
  }*/
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);
  const dictSettingsResponse = useLanguageDictionarySettings(languageId);
  const classesResponse = useLanguageWordClasses(languageId);
  const partsOfSpeechResponse = usePartsOfSpeech();

  useSetPageTitle("Add Word");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(dictSettingsResponse.status !== 'success') {
    return renderDatalessQueryResult(dictSettingsResponse);
  }

  if(classesResponse.status !== 'success') {
    return renderDatalessQueryResult(classesResponse);
  }

  if(partsOfSpeechResponse.status !== 'success') {
    return renderDatalessQueryResult(partsOfSpeechResponse);
  }

  return (
    <AddWordInner
      language={languageResponse.data}
      dictSettings={dictSettingsResponse.data}
      langClasses={classesResponse.data}
      langPartsOfSpeech={partsOfSpeechResponse.data}
    />
  );
}
