import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import Papa from 'papaparse';

import { CForm, CFormBody, CSelect, CTextInput } from '@/components/CForm';
import { DictionaryFilterSelect } from '@/components/Dictionary';

import { useLanguage } from '@/hooks/languages';
import { useLanguageWordsWithClassIds } from '@/hooks/words';

import { ILanguage } from '@/types/languages';
import { IDictionaryFilter, ILanguageWordWithClasses, IWord } from '@/types/words';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

import { sortAndFilterWords } from '@/utils/words';

type ExportField = keyof Omit<IWord, 'langId'> | 'classes';

interface IExportOptions {
  fields: ExportField[];
  delimiter: string;
  quoting: string;
  includeHeader: boolean;
  filter: IDictionaryFilter;
}

function handleExport(words: ILanguageWordWithClasses[], options: IExportOptions) {
  const wordsToExport = sortAndFilterWords(words, options.filter);
  const csvContents = Papa.unparse({
    fields: options.fields,
    data: wordsToExport
  }, {
    delimiter: options.delimiter,
    escapeChar: options.quoting,
    quoteChar: options.quoting,
    header: options.includeHeader,
    newline: '\n'
  });
  const csvBlob = new Blob([csvContents]);
  const linkElement = document.createElement('a');
  linkElement.href = URL.createObjectURL(csvBlob);
  linkElement.download = "export.csv";
  linkElement.click();
}

interface IRunWordExport {
  options: IExportOptions;
  language: ILanguage;
}

function RunWordExport({ options, language }: IRunWordExport) {
  const [hasExported, setHasExported] = useState(false);

  const wordsResponse = useLanguageWordsWithClassIds(language.id);

  useEffect(() => {
    if(!hasExported && wordsResponse.status === 'success') {
      handleExport(wordsResponse.data, options);
      setHasExported(true);
    } else if(hasExported && wordsResponse.status === 'pending') {
      setHasExported(false);
    }
  }, [hasExported, options, wordsResponse]);

  if(wordsResponse.status === 'pending') {
    return <p>Fetching words...</p>;
  } else if(wordsResponse.status === 'error') {
    return <p>Error: {wordsResponse.error.message}</p>;
  } else {
    return <p>{hasExported ? "Export complete." : "Exporting..."}</p>;
  }
}

function ExportWordsInner({ language }: { language: ILanguage }) {
  const queryClient = useQueryClient();

  const possibleCsvFields: ExportField[] = [
    'word', 'ipa', 'meaning', 'pos', 'classes',
    'etymology', 'notes', 'id', 'created', 'updated'
  ];
  const dictionaryFilterFields = possibleCsvFields.filter(
    field => field !== 'word' && field !== 'classes'
  );

  const [csvFields, setCSVFields] = useState<(ExportField | "")[]>(
    possibleCsvFields
  );
  const [delimiter, setDelimiter] = useState(",");
  const [quoting, setQuoting] = useState('"');
  const [includeHeader, setIncludeHeader] = useState(true);
  const [filter, setFilter] = useState<IDictionaryFilter>({
    field: '', type: 'begins', value: "", matchCase: false,
    sortField: 'word', sortDir: 'asc'
  });
  const [errorMessage, setErrorMessage] = useState("");

  const [exportedCsvFields, setExportedCsvFields] = useState<ExportField[] | null>(null);

  function previewWordExport() {
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

    setExportedCsvFields(usedCsvFields as ExportField[]);
    queryClient.resetQueries({
      queryKey: ['languages', language.id, 'words-with-classes']
    });
  }

  return (
    <>
      <h2>Export Words</h2>
      <p>
        Export words from <Link to={'/language/' + language.id}>{language.name}</Link>'s
        dictionary to a CSV file.
      </p>
      {errorMessage && <p><b>{errorMessage}</b></p>}
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
            <td colSpan={2}>
              <label>
                Include header?{" "}
                <input
                  type="checkbox"
                  checked={includeHeader}
                  onChange={e => setIncludeHeader(e.target.checked)}
                />
              </label>
            </td>
          </tr>
          <tr>
            <td colSpan={2}><h4>Field order</h4></td>
          </tr>
          {csvFields.map((field, i) => (
            <CSelect
              label={`Field ${i + 1}`}
              name={"field" + i}
              state={field}
              setState={value => {
                setCSVFields(csvFields.map((f, fi) => {
                  if(fi === i) {
                    return value as (ExportField | "");
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
      </CForm>
      <DictionaryFilterSelect
        fields={dictionaryFilterFields}
        filter={filter}
        setFilter={setFilter}
      />
      <CForm>
        <button type="button" onClick={previewWordExport} style={{ marginTop: "5px" }}>
          Export Words
        </button>
      </CForm>
      {exportedCsvFields && (
        <RunWordExport
          options={{
            fields: exportedCsvFields, delimiter, quoting, includeHeader, filter
          }}
          language={language}
        />
      )}
    </>
  );
}

export default function ExportWords() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(id);

  useSetPageTitle("Export Words");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  return <ExportWordsInner language={languageResponse.data} />;
}
