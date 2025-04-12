import { ReactNode, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Papa from 'papaparse';

import { CFormBody, CSelect, CTextInput } from '../components/CForm.tsx';
import { DictionaryRow, DictionaryTable } from '../components/Dictionary.tsx';
import SaveChangesButton from '../components/SaveChangesButton.tsx';

import { useLanguage, ILanguage, useLanguageWordClasses } from '../languageData';
import {
  renderDatalessQueryResult, sendBackendJson, useGetParamsOrSelectedId, useSetPageTitle
} from '../utils.tsx';
import { IPartOfSpeech, IWord, IWordClass, usePartsOfSpeech } from '../wordData.tsx';

type IImportedWord = Omit<IWord, 'id' | 'created' | 'updated' | 'langId'> & {
  classes: string[];
};

async function sendImportWordsRequest(words: IImportedWord[], langId: string) {
  const reqBody = { words, langId };
  const res = await sendBackendJson(`languages/${langId}/import-words`, 'POST', reqBody);
  if(!res.ok) {
    throw res.body;
  }
  return res.body;
}

interface IImportPreview {
  words: IImportedWord[];
  fields: (keyof IImportedWord)[];
  language: ILanguage;
  langClasses: IWordClass[];
  partsOfSpeech: IPartOfSpeech[];
}

function ImportPreview({ words, fields, language, langClasses, partsOfSpeech }: IImportPreview) {
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);

  function handleSave() {
    navigate('/dictionary/' + language.id);
  }

  return (
    <>
      <SaveChangesButton
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        saveQueryKey={ ['languages', language.id, 'phones', 'update'] }
        saveQueryFn={ async () => await sendImportWordsRequest(words, language.id) }
        handleSave={handleSave}
        style={{ marginTop: "1em", marginBottom: "1em" }}
      >
        Confirm Import
      </SaveChangesButton>
      <DictionaryTable>
        <tr>
          {
            fields.map(f => <th key={f}>{f}</th>)
          }
        </tr>
        {
          words.map((word, i) => (
            <DictionaryRow
              word={{ ...word, classes: word.classes.map(
                id => langClasses.find(cls => cls.id === id)?.code
              ).join(", ") }}
              fields={fields}
              language={language}
              partsOfSpeech={partsOfSpeech}
              showLinkColumn={false}
              key={i}
            />
          ))
        }
      </DictionaryTable>
      <SaveChangesButton
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        saveQueryKey={ ['languages', language.id, 'phones', 'update'] }
        saveQueryFn={ async () => await sendImportWordsRequest(words, language.id) }
        handleSave={handleSave}
        style={{ marginTop: "1em" }}
      >
        Confirm Import
      </SaveChangesButton>
    </>
  );
}

interface IImportWordsInner {
  language: ILanguage;
  langClasses: IWordClass[];
  partsOfSpeech: IPartOfSpeech[];
}

function ImportWordsInner({ language, langClasses, partsOfSpeech }: IImportWordsInner) {
  const possibleCsvFields: (keyof IImportedWord)[] = [
    'word', 'ipa', 'meaning', 'pos', 'etymology', 'notes', 'classes'
  ];

  const [ csvFields, setCSVFields ] = useState<(keyof IImportedWord | "")[]>(
    possibleCsvFields.map(() => "")
  );
  const [ delimiter, setDelimiter ] = useState(",");
  const [ quoting, setQuoting ] = useState('"');
  const [ errorMessage, setErrorMessage ] = useState("");

  const [imported, setImported] = useState<IImportedWord[] | null>(null);
  const [importedFields, setImportedFields] = useState<(keyof IImportedWord)[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function processImportedWords(results: Papa.ParseResult<string[]>) {
    const usedCsvFields = csvFields.slice();
    while(usedCsvFields[usedCsvFields.length - 1] === "") {
      usedCsvFields.pop();
    }
    if(usedCsvFields.length === 0) {
      setErrorMessage("Please assign at least one field.");
      return;
    } else if(usedCsvFields.includes("")) {
      setErrorMessage("Fields must be assigned sequentially starting with field 1.");
      return;
    }
    for(const field of ['word', 'meaning', 'pos'] as const) {
      if(!usedCsvFields.includes(field)) {
        setErrorMessage(`The ${field} field must be assigned.`);
        return;
      }
    }
    
    if(results.errors.length > 0) {
      setErrorMessage(results.errors.map(
        e => `Error${e.row !== undefined && ` on row ${e.row + 1}`}: ${e.message}.`
      ).join(" "));
      return;
    }
    const importedWords: IImportedWord[] = [];
    for(const [row, result] of results.data.entries()) {
      if(result.length <= 1 && !result[0]) {
        continue;
      }
      if(result.length !== usedCsvFields.length) {
        setErrorMessage(
          `Error on row ${row + 1}: Wrong number of fields (found ${result.length}).`
        );
        return;
      }

      const word: IImportedWord = {
        word: "", ipa: "", meaning: "", pos: "", etymology: "", notes: "", classes: []
      };

      const wordPos = result[usedCsvFields.indexOf('pos')].toLowerCase();
      if(!partsOfSpeech.some(pos => pos.code === wordPos)) {
        setErrorMessage(`Error on row ${row + 1}: Invalid POS "${wordPos}".`);
        return;
      }
      word.pos = wordPos;

      for(let i = 0; i < result.length; ++i) {
        const field = usedCsvFields[i];
        if(field === 'classes') {
          const classCodes = result[i] ? result[i].split(",") : [];
          const classIds = [];
          if(classCodes.length > 0) {
            for(const code of classCodes) {
              const classes = langClasses.filter(cls => cls.code === code);
              if(classes.length === 0) {
                setErrorMessage(`Error on row ${row + 1}: Unknown class code "${code}".`);
                return;
              }
              const cls = classes.find(cls => cls.pos === word.pos);
              if(!cls) {
                setErrorMessage(
                  `Error on row ${row + 1}: No class "${code}" found for the given POS.`
                );
                return;
              }
              classIds.push(cls.id);
            }
          }
          word.classes = classIds;
        } else if(field !== 'pos') {
          const index = field as keyof Omit<IImportedWord, 'classes'>;
          word[index] = result[i];
        }
      }
      importedWords.push(word);
    }
    setErrorMessage("");
    setImported(importedWords);
    setImportedFields(usedCsvFields as (keyof IImportedWord)[]);
  }

  async function importFromFile() {
    if(fileInputRef.current) {
      if(!fileInputRef.current.files?.item(0)) {
        setErrorMessage("Please select a file.");
        return;
      }
      const file = fileInputRef.current.files.item(0)!;
      Papa.parse<string[]>(file, {
        delimiter,
        quoteChar: quoting,
        complete: processImportedWords
      });
    }
  }
  
  return (
    <>
      <h2>Import Words</h2>
      <p>
        Import words into <Link to={ '/language/' + language.id }>{ language.name }</Link>'s
        dictionary from a CSV file.
      </p>
      <p>
        Valid POS codes: {
          partsOfSpeech.flatMap((pos, i) => {
            const result: ReactNode[] = i === 0 ? [] : [", "];
            result.push(<abbr title={ pos.name } key={i}>{ pos.code }</abbr>);
            return result;
          })
        }
      </p>
      <p>
        Class codes should be comma-separated.
      </p>
      { errorMessage && <p><b>{errorMessage}</b></p> }
      <form className="chronologue-form">
        <CFormBody>
          <CTextInput
            label="Delimiter"
            name="delimiter"
            state={delimiter}
            setState={setDelimiter}
            width="2em"
          />
          <CTextInput
            label="Quoting"
            name="quoting"
            state={quoting}
            setState={setQuoting}
            width="2em"
          />
          <tr>
            <td colSpan={2}><h4>Field order</h4></td>
          </tr>
          {
            csvFields.map((field, i) => (
              <CSelect
                label={ `Field ${i + 1}` }
                name={ "field" + i }
                state={field}
                setState={
                  value => setCSVFields(csvFields.map((f, fi) => {
                    if(fi === i) {
                      return value as (keyof IImportedWord | "");
                    } else if(f === value) {
                      return "";
                    } else {
                      return f;
                    }
                  }))
                }
                key={i}
              >
                <option value="">---</option>
                {
                  possibleCsvFields.map(field => (
                    <option value={field} key={field}>
                      { field === 'classes' ? 'class codes' : field }
                    </option>
                  ))
                }
              </CSelect>
            ))
          }
        </CFormBody>
        <div style={{ marginTop: "1em" }}>
          <input type="file" ref={fileInputRef} />
        </div>
        <button type="button" onClick={importFromFile}>
          Preview Import
        </button>
      </form>
      {
        imported && (
          <ImportPreview
            words={imported}
            fields={importedFields!}
            language={language}
            langClasses={langClasses}
            partsOfSpeech={partsOfSpeech}
          />
        )
      }
    </>
  );
}

export default function ImportWords() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }
  
  const languageResponse = useLanguage(id);
  const languageClassesResponse = useLanguageWordClasses(id);
  const partsOfSpeechResponse = usePartsOfSpeech();
  
  useSetPageTitle("Import Words");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(languageClassesResponse.status !== 'success') {
    return renderDatalessQueryResult(languageClassesResponse);
  }

  if(partsOfSpeechResponse.status !== 'success') {
    return renderDatalessQueryResult(partsOfSpeechResponse);
  }

  return (
    <ImportWordsInner
      language={ languageResponse.data }
      langClasses={ languageClassesResponse.data }
      partsOfSpeech={ partsOfSpeechResponse.data }
    />
  );
};
