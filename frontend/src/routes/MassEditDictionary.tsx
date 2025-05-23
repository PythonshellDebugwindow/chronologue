import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { DictionaryFilterSelect, DictionaryTable } from '@/components/Dictionary';
import SaveChangesButton from '@/components/SaveChangesButton';

import { useLanguage, useLanguageDictionarySettings } from '@/hooks/languages';
import { usePartsOfSpeech, useLanguageWords } from '@/hooks/words';

import { IDictionarySettings, ILanguage } from '@/types/languages';
import { IDictionaryFilter, IPartOfSpeech, IWord } from '@/types/words';

import {
  useGetParamsOrSelectedId,
  useSetPageTitle,
  useUnsavedPopup
} from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

import {
  formatDictionaryFieldValue,
  formatPosAbbr,
  formatWordEtymology,
  sortAndFilterWords,
  userFacingFieldName
} from '@/utils/words';

async function sendPerformMassEditRequest(
  changes: { [id: string]: string }, field: string, langId: string
) {
  const reqBody = { changes, field };
  const res = await sendBackendJson(`languages/${langId}/mass-edit-dictionary`, 'POST', reqBody);
  if(!res.ok) {
    throw res.body;
  }
  return res.body;
}

interface IDictionaryField {
  name: keyof IWord;
  isDisplaying: boolean;
}

function getAllFields(dictSettings: IDictionarySettings, selectedField: string = '') {
  const all = ['word', 'meaning', 'ipa', 'pos', 'etymology', 'notes', 'created', 'updated'];
  if(!dictSettings.showWordIpa) {
    all.splice(all.indexOf('ipa'), 1);
  }
  const displaying = ['word', 'meaning', 'pos', selectedField];
  return all.map(field => ({
    name: field as keyof IWord,
    isDisplaying: displaying.includes(field)
  }));
}

type IEditField = Omit<keyof IWord, 'created' | 'updated'>;

interface IMassEditDictionaryRow {
  word: IWord;
  linkText: string;
  fields: (keyof IWord)[];
  editField: IEditField;
  updateEditField: (value: string) => void;
  language: ILanguage;
  partsOfSpeech: IPartOfSpeech[];
}

function MassEditDictionaryRow({
  word, linkText, fields, editField, updateEditField, language, partsOfSpeech
}: IMassEditDictionaryRow) {
  function formatValue(field: keyof IWord) {
    if(field === editField && !(word[field] instanceof Date)) {
      return word[field];
    }
    switch(field) {
      case 'word':
        return (
          <Link to={'/word/' + word.id}>
            {(language.status === 'proto' ? "*" : "") + linkText}
          </Link>
        );
      case 'pos':
        return formatPosAbbr(word.pos!, partsOfSpeech);
      case 'etymology':
        return formatWordEtymology(word.etymology!);
      default:
        return word[field] && formatDictionaryFieldValue(word, field);
    }
  }

  return (
    <tr>
      {editField === 'word' && (
        <td>
          <Link to={'/word/' + word.id}>
            {(language.status === 'proto' ? "*" : "") + linkText}
          </Link>
        </td>
      )}
      {fields.map((field, i) => (
        <td key={i}>
          {
            field === editField
              ? <input
                  type="text"
                  value={formatValue(field) as string}
                  onChange={e => updateEditField(e.target.value)}
                />
              : formatValue(field)
          }
        </td>
      ))}
    </tr>
  );
}

interface IMassEditDictionaryTable {
  language: ILanguage;
  initialWords: IWord[];
  dictSettings: IDictionarySettings;
  partsOfSpeech: IPartOfSpeech[];
  editField: keyof IWord;
}

function MassEditDictionaryTable(
  { language, initialWords, dictSettings, partsOfSpeech, editField }: IMassEditDictionaryTable
) {
  const allFields = getAllFields(dictSettings, editField);
  const [fields, setFields] = useState<IDictionaryField[]>(allFields);

  const displayedFieldNames = fields.flatMap(f => f.isDisplaying ? [f.name] : []);

  const [words, setWords] = useState(initialWords);

  const changes = useRef<{ [id: string]: string }>({});

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  useUnsavedPopup(!isSaved);

  function enableField(field: IDictionaryField) {
    const index = fields.indexOf(field);
    setFields(fields.with(index, { name: field.name, isDisplaying: true }));
  }

  function disableField(field: IDictionaryField) {
    const index = fields.indexOf(field);
    setFields(fields.with(index, { name: field.name, isDisplaying: false }));
  }

  function makeUpdateEditField(word: IWord) {
    return (value: string) => {
      setWords(words.map(w => (
        w === word ? { ...w, [editField]: value } : w
      )));
      changes.current[word.id] = value;
      setIsSaved(false);
    };
  }

  if(words.length === 0) {
    return <p>No words found.</p>;
  }

  return (
    <>
      <p>
        {words.length} word{words.length !== 1 && "s"} found.
      </p>
      <p>
        More fields:
        {fields.map(field => !field.isDisplaying && (
          <button
            className="enable-dictionary-field-button"
            onClick={() => enableField(field)}
            key={field.name}
          >
            + {userFacingFieldName(field.name)}
          </button>
        ))}
      </p>
      {!isSaved && (
        <SaveChangesButton
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          saveQueryKey={['languages', language.id, 'mass-edit-dictionary']}
          saveQueryFn={async () => {
            return await sendPerformMassEditRequest(changes.current, editField, language.id);
          }}
          handleSave={() => setIsSaved(true)}
          style={{ marginBottom: "1em" }}
        >
          Save changes
        </SaveChangesButton>
      )}
      <DictionaryTable>
        <tr>
          {editField === 'word' && (
            <th>Link</th>
          )}
          {fields.map(f => f.isDisplaying && (
            <th key={f.name}>
              {userFacingFieldName(f.name)}
              {f.name !== 'word' && f.name !== 'meaning' && f.name !== editField && (
                <button
                  className="letter-button letter-button-x"
                  onClick={() => disableField(f)}
                />
              )}
            </th>
          ))}
        </tr>
        {words.map((word, i) => (
          <MassEditDictionaryRow
            word={word}
            linkText={initialWords[i].word}
            fields={displayedFieldNames}
            editField={editField}
            updateEditField={makeUpdateEditField(word)}
            language={language}
            partsOfSpeech={partsOfSpeech}
            key={word.id}
          />
        ))}
      </DictionaryTable>
      {!isSaved && (
        <SaveChangesButton
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          saveQueryKey={['languages', language.id, 'mass-edit-dictionary']}
          saveQueryFn={async () => {
            return await sendPerformMassEditRequest(changes.current, editField, language.id);
          }}
          handleSave={() => setIsSaved(true)}
          style={{ marginTop: "1em" }}
        >
          Save changes
        </SaveChangesButton>
      )}
    </>
  );
}

type IMassEditDictionaryTableGetWords = Omit<IMassEditDictionaryTable, 'initialWords'> & {
  filter: IDictionaryFilter;
};

function MassEditDictionaryTableGetWords({
  language, filter, dictSettings, partsOfSpeech, editField
}: IMassEditDictionaryTableGetWords) {
  const dictResponse = useLanguageWords(language.id);

  if(dictResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(dictResponse.status === 'error') {
    return <p>Error: {dictResponse.error.message}</p>;
  }

  return (
    <MassEditDictionaryTable
      language={language}
      initialWords={sortAndFilterWords(dictResponse.data, filter)}
      dictSettings={dictSettings}
      partsOfSpeech={partsOfSpeech}
      editField={editField}
    />
  );
}

interface IMassEditDictionaryInner {
  language: ILanguage;
  dictSettings: IDictionarySettings;
  partsOfSpeech: IPartOfSpeech[];
}

function MassEditDictionaryInner(
  { language, dictSettings, partsOfSpeech }: IMassEditDictionaryInner
) {
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<IDictionaryFilter>({
    field: '', type: 'begins', value: "", matchCase: false,
    sortField: 'word', sortDir: 'asc'
  });

  const [editField, setEditField] = useState<IEditField | "">("");
  const [editingFilter, setEditingFilter] = useState<IDictionaryFilter | null>(null);
  const [editingField, setEditingField] = useState<IEditField | null>(null);
  const [message, setMessage] = useState("");

  const filterFieldNames = getAllFields(dictSettings).flatMap(f => (
    f.name === 'word' ? [] : [f.name]
  ));
  const editFieldNames = ['word', 'meaning', 'ipa', 'etymology', 'notes'];
  if(!dictSettings.showWordIpa) {
    editFieldNames.splice(editFieldNames.indexOf('ipa'), 1);
  }

  function beginMassEdit() {
    if(!editField) {
      setMessage("Please select a field to edit.");
      return;
    }

    setMessage("");

    if(editingFilter !== null) {
      if(!confirm("This will overwrite any unsaved edits you have made below. Continue?")) {
        return;
      }
    }
    setEditingFilter({ ...filter });
    setEditingField(editField);

    queryClient.removeQueries({ queryKey: ['languages', language.id, 'words'] });
  }

  return (
    <>
      <h2>Mass Edit Dictionary</h2>
      <p>
        Mass edit <Link to={'/language/' + language.id}>{language.name}</Link>'s dictionary.
      </p>
      <DictionaryFilterSelect
        fields={filterFieldNames}
        filter={filter}
        setFilter={setFilter}
      />
      <p>
        Edit field:{" "}
        <select
          value={editField as string}
          onChange={e => setEditField(e.target.value as IEditField)}
        >
          <option value="">---</option>
          {editFieldNames.map(field => (
            <option value={field} key={field}>
              {userFacingFieldName(field)}
            </option>
          ))}
        </select>
      </p>
      {message && <p><b>{message}</b></p>}
      <button onClick={beginMassEdit}>Search</button>
      {editingFilter && editingField && (
        <MassEditDictionaryTableGetWords
          language={language}
          filter={editingFilter}
          dictSettings={dictSettings}
          partsOfSpeech={partsOfSpeech}
          editField={editingField as keyof IWord}
        />
      )}
    </>
  );
}

export default function MassEditDictionary() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);
  const dictSettingsResponse = useLanguageDictionarySettings(languageId);
  const posResponse = usePartsOfSpeech();

  useSetPageTitle("Mass Edit Dictionary");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(dictSettingsResponse.status !== 'success') {
    return renderDatalessQueryResult(dictSettingsResponse);
  }

  if(posResponse.status !== 'success') {
    return renderDatalessQueryResult(posResponse);
  }

  return (
    <MassEditDictionaryInner
      language={languageResponse.data}
      dictSettings={dictSettingsResponse.data}
      partsOfSpeech={posResponse.data}
    />
  );
};
