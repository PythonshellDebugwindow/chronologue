import { ReactNode, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Papa from 'papaparse';

import { CForm, CFormBody, CSelect, CTextInput } from '@/components/CForm';
import { DictionaryRow, DictionaryTable } from '@/components/Dictionary';
import { InfoParagraph } from '@/components/Paragraphs';
import SaveChangesButton from '@/components/SaveChangesButton';

import { useLanguage, useLanguageWordClasses } from '@/hooks/languages';
import { usePartsOfSpeech } from '@/hooks/words';

import { ILanguage } from '@/types/languages';
import { IPartOfSpeech, IWord, IWordClass } from '@/types/words';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

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
      <p>
        Importing {words.length} word{words.length !== 1 && "s"}.
      </p>
      <SaveChangesButton
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        saveQueryKey={['languages', language.id, 'phones', 'update']}
        saveQueryFn={async () => await sendImportWordsRequest(words, language.id)}
        handleSave={handleSave}
        style={{ marginTop: "1em", marginBottom: "1em" }}
      >
        Confirm Import
      </SaveChangesButton>
      <DictionaryTable>
        <tr>
          {fields.map(f => (
            <th key={f}>{f}</th>
          ))}
        </tr>
        {words.map((word, i) => (
          <DictionaryRow
            word={{
              ...word,
              classes: word.classes.map(
                id => langClasses.find(cls => cls.id === id)?.code
              ).join(", ")
            }}
            fields={fields}
            language={language}
            partsOfSpeech={partsOfSpeech}
            showLinkColumn={false}
            key={i}
          />
        ))}
      </DictionaryTable>
      <SaveChangesButton
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        saveQueryKey={['languages', language.id, 'phones', 'update']}
        saveQueryFn={async () => await sendImportWordsRequest(words, language.id)}
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
    'word', 'ipa', 'meaning', 'pos', 'classes', 'etymology', 'notes'
  ];

  const [csvFields, setCSVFields] = useState<(keyof IImportedWord | "")[]>(
    possibleCsvFields.map(() => "")
  );
  const [delimiter, setDelimiter] = useState(",");
  const [quoting, setQuoting] = useState('"');
  const [useHeaderFields, setUseHeaderFields] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [imported, setImported] = useState<IImportedWord[] | null>(null);
  const [importedFields, setImportedFields] = useState<(keyof IImportedWord)[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function processImportedWords(results: Papa.ParseResult<string[] | { [key: string]: string }>) {
    const usedCsvFields = results.meta.fields ?? csvFields.slice();
    for(const field of usedCsvFields) {
      if(field === "") {
        if(results.meta.fields) {
          setErrorMessage("Error: Field names cannot be empty.");
          return;
        }
      } else if(field.endsWith("_1") && usedCsvFields.includes(field.slice(0, -2))) {
        const originalField = field.slice(0, -2);
        setErrorMessage(`Error: Duplicate field name '${originalField}' found.`);
        return;
      } else if(!(possibleCsvFields as string[]).includes(field)) {
        setErrorMessage(`Error: Invalid field name '${field}' found.`);
        return;
      }
    }
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
      const resultIsArray = Array.isArray(result);
      if(resultIsArray && result.length !== usedCsvFields.length) {
        setErrorMessage(
          `Error on row ${row + 1}: Wrong number of fields (found ${result.length}).`
        );
        return;
      }

      const word: IImportedWord = {
        word: "", ipa: "", meaning: "", pos: "", etymology: "", notes: "", classes: []
      };

      const wordPosRaw = resultIsArray ? result[usedCsvFields.indexOf('pos')] : result.pos;
      const wordPos = wordPosRaw.toLowerCase();
      if(!partsOfSpeech.some(pos => pos.code === wordPos)) {
        const errorText = (
          wordPos ? `Invalid POS "${wordPos}"` : "The POS field cannot be empty"
        );
        setErrorMessage(`Error on row ${row + 1}: ${errorText}.`);
        return;
      }
      word.pos = wordPos;

      const resultFields = resultIsArray ? usedCsvFields : Object.keys(result);
      for(let i = 0; i < resultFields.length; ++i) {
        const field = resultFields[i];
        const fieldValue = resultIsArray ? result[i] : result[field];
        if(field === 'classes') {
          if(!fieldValue) {
            continue;
          }
          const classCodes = fieldValue.split(",");
          const classIds = [];
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
          word.classes = classIds;
        } else if(field !== 'pos') {
          if((field === 'word' || field === 'meaning') && !fieldValue) {
            setErrorMessage(`Error on row ${row + 1}: The ${field} field cannot be empty.`);
            return;
          } else if(!(possibleCsvFields as string[]).includes(field)) {
            setErrorMessage(`Error on row ${row + 1}: Invalid field name '${field}'.`);
            return;
          }
          const index = field as keyof Omit<IImportedWord, 'classes'>;
          word[index] = fieldValue;
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
      const file = fileInputRef.current.files?.item(0);
      if(!file) {
        setErrorMessage("Please select a file.");
        return;
      }
      Papa.parse(file, {
        delimiter,
        quoteChar: quoting,
        header: useHeaderFields,
        skipEmptyLines: true,
        complete: processImportedWords
      });
    }
  }

  return (
    <>
      <h2>Import Words</h2>
      <p>
        Import words into <Link to={'/language/' + language.id}>{language.name}</Link>'s
        dictionary from a CSV file.
      </p>
      <p>
        Valid POS codes:{" "}
        {partsOfSpeech.flatMap((pos, i) => {
          const result: ReactNode[] = i === 0 ? [] : [", "];
          result.push(<abbr title={pos.name} key={i}>{pos.code}</abbr>);
          return result;
        })}
      </p>
      <p>
        Class codes should be comma-separated.
      </p>
      {errorMessage && <InfoParagraph><b>{errorMessage}</b></InfoParagraph>}
      <CForm>
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
          <tr>
            <td colSpan={2}>
              <label>
                Use header fields?{" "}
                <input
                  type="checkbox"
                  checked={useHeaderFields}
                  onChange={e => setUseHeaderFields(e.target.checked)}
                />
              </label>
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ fontSize: "0.9em" }}>
              The first line will {!useHeaderFields && "not "}be treated as a header.
              {useHeaderFields && (
                <div>
                  Valid field names:
                  <code style={{ fontSize: "0.9em", margin: "0 20px", display: "block" }}>
                    {possibleCsvFields.join(", ")}
                  </code>
                </div>
              )}
            </td>
          </tr>
          {!useHeaderFields && csvFields.map((field, i) => (
            <CSelect
              label={`Field ${i + 1}`}
              name={"field" + i}
              state={field}
              setState={value => {
                setCSVFields(csvFields.map((f, fi) => {
                  if(fi === i) {
                    return value as (keyof IImportedWord | "");
                  } else if(f === value) {
                    return "";
                  } else {
                    return f;
                  }
                }));
              }}
              key={i}
            >
              <option value="">---</option>
              {possibleCsvFields.map(field => (
                <option value={field} key={field}>
                  {field === 'classes' ? 'class codes' : field}
                </option>
              ))}
            </CSelect>
          ))}
        </CFormBody>
        <div style={{ marginTop: "1em" }}>
          <input type="file" ref={fileInputRef} />
        </div>
        <button type="button" onClick={importFromFile}>
          Preview Import
        </button>
      </CForm>
      {errorMessage && <InfoParagraph><b>{errorMessage}</b></InfoParagraph>}
      {imported && (
        <ImportPreview
          words={imported}
          fields={importedFields!}
          language={language}
          langClasses={langClasses}
          partsOfSpeech={partsOfSpeech}
        />
      )}
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
      language={languageResponse.data}
      langClasses={languageClassesResponse.data}
      partsOfSpeech={partsOfSpeechResponse.data}
    />
  );
}
