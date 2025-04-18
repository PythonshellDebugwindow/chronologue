import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import {
  DictionaryFilterSelect, DictionaryTable, IDictionaryFilter, sortAndFilterWords
} from '../components/Dictionary.tsx';
import SaveChangesButton from '../components/SaveChangesButton.tsx';

import {
  useLanguage, ILanguage, useLanguageDictionarySettings, IDictionarySettings
} from '../languageData.tsx';
import { ApplySCARulesQueryResult, useApplySCARulesQuery } from '../phoneData.tsx';
import {
  renderDatalessQueryResult, sendBackendJson, useGetParamsOrSelectedId, useSetPageTitle,
  useUnsavedPopup
} from '../utils.tsx';
import {
  formatDictionaryFieldValue, formatPosAbbr, formatWordEtymology, usePartsOfSpeech,
  useLanguageWords, userFacingFieldName, IPartOfSpeech, IWord
} from '../wordData.tsx';

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

function getAllFields(dictSettings: IDictionarySettings) {
  const all = ['word', 'meaning', 'ipa', 'pos', 'etymology', 'notes', 'created', 'updated'];
  if(!dictSettings.showWordIpa) {
    all.splice(all.indexOf('ipa'), 1);
  }
  const displaying = ['word', 'meaning', 'pos'];
  return all.map(field => ({
    name: field as keyof IWord,
    isDisplaying: displaying.includes(field)
  }));
}

type IEditField = 'word' | 'ipa';

interface IMassEditDictionaryRow {
  word: IWord;
  fields: (keyof IWord)[];
  editField: IEditField;
  result: ApplySCARulesQueryResult;
  language: ILanguage;
  partsOfSpeech: IPartOfSpeech[];
}

function PreviewChangesRow(
  { word, fields, editField, result, language, partsOfSpeech }: IMassEditDictionaryRow
) {
  function formatValue(field: keyof IWord) {
    switch(field) {
      case 'word':
        return (
          <Link to={ '/word/' + word.id }>
            { (language.status === 'proto' ? "*" : "") + word.word }
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
      <td>
        { word[editField] }
      </td>
      <td>
        {
          result.success
          ? result.result
          : <span style={{ color: "red" }}>{ result.message }</span>
        }
      </td>
      {
        fields.map((field, i) => !(field === 'ipa' && editField === 'ipa') && (
          <td key={i}>
            { formatValue(field) }
          </td>
        ))
      }
    </tr>
  );
}

interface ISCAResultsPreview {
  language: ILanguage;
  words: IWord[];
  editField: IEditField;
  rules: string;
  dictSettings: IDictionarySettings;
  partsOfSpeech: IPartOfSpeech[];
}

function SCAResultsPreview(
  { language, words, editField, rules, dictSettings, partsOfSpeech }: ISCAResultsPreview
) {
  const allFields = getAllFields(dictSettings);
  const [fields, setFields] = useState<IDictionaryField[]>(allFields);
  
  const displayedFieldNames = fields.flatMap(f => f.isDisplaying ? [f.name] : []);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [lastSavedWords, setLastSavedWords] = useState<IWord[] | null>(null);
  if(lastSavedWords !== words) {
    setLastSavedWords(words);
    setIsSaved(false);
  }

  const scaQuery = useApplySCARulesQuery(
    language.id, words.map(w => w[editField]), rules,
    editField === 'word' ? "orth" : "phone", true
  );
  
  useUnsavedPopup(!isSaved);

  if(scaQuery.status === 'pending') {
    return <p>Loading...</p>;
  } else if(scaQuery.status === 'error') {
    return <p>Error: { scaQuery.error.message }</p>;
  }

  const scaResults = scaQuery.data;

  if(words.length !== scaResults.length) {
    throw new Error(`Found ${words.length} words, but got ${scaResults.length} results`);
  }

  const anyScaResultFailed = scaResults.some(r => !r.success);
  
  function enableField(field: IDictionaryField) {
    const index = fields.indexOf(field);
    setFields(fields.with(index, { name: field.name, isDisplaying: true }));
  }
  
  function disableField(field: IDictionaryField) {
    const index = fields.indexOf(field);
    setFields(fields.with(index, { name: field.name, isDisplaying: false }));
  }

  async function confirmChanges() {
    const changes: { [id: string]: string } = {};
    for(const i in words) {
      if(!scaResults[i].success) {
        return null;
      }
      changes[words[i].id] = scaResults[i].result;
    }
    return await sendPerformMassEditRequest(changes, editField, language.id);
  }

  return (
    <>
      <p>
        More fields:
        {
          fields.map(field => (
            !field.isDisplaying && !(field.name === 'ipa' && editField === 'ipa') && (
              <button
                className="enable-dictionary-field-button"
                onClick={ () => enableField(field) }
                key={field.name}
              >
                + { userFacingFieldName(field.name) }
              </button>
            )
          ))
        }
      </p>
      <p>
        { words.length || "No" } word{ words.length !== 1 && "s" } found.
      </p>
      {
        !isSaved && (
          anyScaResultFailed
          ? <p><b>Please fix all SCA errors before saving.</b></p>
          : <SaveChangesButton
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              saveQueryKey={ ['languages', language.id, 'dictionary-chronosca'] }
              saveQueryFn={confirmChanges}
              handleSave={ () => setIsSaved(true) }
              style={{ marginBottom: "1em" }}
            >
              Save changes
            </SaveChangesButton>
        )
      }
      <DictionaryTable>
        <tr>
          <th>Input</th>
          <th>Result</th>
          {
            fields.map(
              f => f.isDisplaying && (
                <th key={f.name}>
                  { userFacingFieldName(f.name) }
                  {
                    f.name !== 'word' && f.name !== 'meaning' && f.name !== editField && (
                      <button
                        className="letter-button letter-button-x"
                        onClick={ () => disableField(f) }
                      />
                    )
                  }
                </th>
              )
            )
          }
        </tr>
        {
          words.map((word, i) => (
            <PreviewChangesRow
              word={word}
              fields={displayedFieldNames}
              editField={editField}
              result={ scaResults[i] }
              language={language}
              partsOfSpeech={partsOfSpeech}
              key={ word.id }
            />
          ))
        }
      </DictionaryTable>
      {
        !isSaved && (
          anyScaResultFailed
          ? <p><b>Please fix all SCA errors before saving.</b></p>
          : <SaveChangesButton
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              saveQueryKey={ ['languages', language.id, 'dictionary-chronosca'] }
              saveQueryFn={confirmChanges}
              handleSave={ () => setIsSaved(true) }
              style={{ marginTop: "1em" }}
            >
              Save changes
            </SaveChangesButton>
        )
      }
    </>
  );
}

interface IRunDictionarySCAInner {
  language: ILanguage;
  initialWords: IWord[];
  dictSettings: IDictionarySettings;
  partsOfSpeech: IPartOfSpeech[];
}

function RunDictionarySCAInner(
  { language, initialWords, dictSettings, partsOfSpeech }: IRunDictionarySCAInner
) {
  const queryClient = useQueryClient();
  
  const [filter, setFilter] = useState<IDictionaryFilter>({
    field: '', type: 'begins', value: "", matchCase: false,
    sortField: 'word', sortDir: 'asc'
  });

  const [editField, setEditField] = useState<IEditField>('word');
  const [editingWords, setEditingWords] = useState<IWord[] | null>(null);
  const [editingField, setEditingField] = useState<IEditField | null>(null);
  const [rules, setRules] = useState("");
  const [message, setMessage] = useState("");
  
  const filterFieldNames = getAllFields(dictSettings).flatMap(f => (
    f.name === 'word' ? [] : [f.name]
  ));
  const editFieldNames = dictSettings.showWordIpa ? ['word', 'ipa'] : ['word'];

  function previewChanges() {
    if(!editField) {
      setMessage("Please select a field to edit.");
      return;
    }
    
    setMessage("");

    if(editingWords !== null) {
      if(!confirm("This will overwrite any unsaved changes you have made. Continue?")) {
        return;
      }
    }
    setEditingWords(sortAndFilterWords(initialWords, filter));
    setEditingField(editField);
    queryClient.removeQueries({ queryKey: ['languages', language.id, 'apply-sca-rules'] });
  }

  return (
    <>
      <h2>Dictionary ChronoSCA</h2>
      <p>
        Run <Link to={ '/chronosca/' + language.id }>ChronoSCA</Link> rules on{" "}
        <Link to={ '/language/' + language.id }>{ language.name }</Link>'s dictionary.
      </p>
      <DictionaryFilterSelect
        fields={filterFieldNames}
        filter={filter}
        setFilter={setFilter}
      />
      <p>
        Edit field:{" "}
        <select
          value={ editField as string }
          onChange={ e => setEditField(e.target.value as IEditField) }
        >
          {
            editFieldNames.map(field => (
              <option value={field} key={field}>
                { userFacingFieldName(field) }
              </option>
            ))
          }
        </select>
      </p>
      <h4>Rules:</h4>
      <textarea
        value={rules}
        onChange={ e => setRules(e.target.value) }
        style={{ width: "20em", height: "10em", marginBottom: "1em" }}
      />
      <br />
      { message && <p style={{ marginTop: "0" }}><b>{message}</b></p> }
      <button onClick={previewChanges}>Preview changes</button>
      {
        editingField && editingWords && (
          <SCAResultsPreview
            language={language}
            words={editingWords}
            editField={editingField}
            rules={rules}
            dictSettings={dictSettings}
            partsOfSpeech={partsOfSpeech}
          />
        )
      }
    </>
  );
}

export default function RunDictionarySCA() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);
  const dictResponse = useLanguageWords(languageId);
  const dictSettingsResponse = useLanguageDictionarySettings(languageId);
  const posResponse = usePartsOfSpeech();

  useSetPageTitle("Dictionary ChronoSCA");
  
  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(dictResponse.status !== 'success') {
    return renderDatalessQueryResult(dictResponse);
  }

  if(dictSettingsResponse.status !== 'success') {
    return renderDatalessQueryResult(dictSettingsResponse);
  }

  if(posResponse.status !== 'success') {
    return renderDatalessQueryResult(posResponse);
  }

  return (
    <RunDictionarySCAInner
      language={ languageResponse.data }
      initialWords={ dictResponse.data }
      dictSettings={ dictSettingsResponse.data }
      partsOfSpeech={ posResponse.data }
    />
  );
};
