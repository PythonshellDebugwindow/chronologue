import { Dispatch, SetStateAction, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import {
  DictionaryFilterSelect,
  DictionaryTable,
  EnableDictionaryFieldButtons
} from '@/components/Dictionary';
import { LetterButtonXNoShadow } from '@/components/LetterButtons';
import SaveChangesButton from '@/components/SaveChangesButton';

import { useLanguage, useLanguageDictionarySettings } from '@/hooks/languages';
import { useApplySCARulesQuery } from '@/hooks/phones';
import { useLanguageWords, usePartsOfSpeech } from '@/hooks/words';

import { IDictionarySettings, ILanguage } from '@/types/languages';
import { ApplySCARulesQueryResult } from '@/types/phones';
import {
  IDictionaryField,
  IDictionaryFilter,
  IPartOfSpeech,
  IWord
} from '@/types/words';

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
          <Link to={'/word/' + word.id}>
            {(language.status === 'proto' ? "*" : "") + word.word}
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
        {word[editField]}
      </td>
      <td>
        {
          result.success
            ? result.result
            : <span style={{ color: "red" }}>{result.message}</span>
        }
      </td>
      {fields.map((field, i) => !(field === 'ipa' && editField === 'ipa') && (
        <td key={i}>
          {formatValue(field)}
        </td>
      ))}
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
  setIsPreviewing: Dispatch<SetStateAction<boolean>>;
}

function SCAResultsPreview(
  { language, words, editField, rules, dictSettings, partsOfSpeech, setIsPreviewing }: ISCAResultsPreview
) {
  const allFields = getAllFields(dictSettings);
  const [fields, setFields] = useState<IDictionaryField[]>(allFields);

  const displayedFieldNames = fields.flatMap(f => f.isDisplaying ? [f.name] : []);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const scaQuery = useApplySCARulesQuery(
    language.id, words.map(w => w[editField]), rules,
    editField === 'word' ? "orth" : "phone", true
  );

  useUnsavedPopup(!isSaved);

  if(scaQuery.status === 'pending') {
    return <p>Loading...</p>;
  } else if(scaQuery.status === 'error') {
    return <p>Error: {scaQuery.error.message}</p>;
  }

  const scaResults = scaQuery.data;

  if(words.length !== scaResults.length) {
    throw new Error(`Found ${words.length} words, but got ${scaResults.length} results`);
  }

  const anyScaResultFailed = scaResults.some(r => !r.success);

  const changedWords = words.flatMap((word, i) => (
    (!scaResults[i].success || word[editField] !== scaResults[i].result)
      ? [{ word, scaResult: scaResults[i] }]
      : []
  ));

  function disableField(field: IDictionaryField) {
    const index = fields.indexOf(field);
    setFields(fields.with(index, { name: field.name, isDisplaying: false }));
  }

  async function confirmChanges() {
    const changeMap: { [id: string]: string } = {};
    for(const changed of changedWords) {
      if(!changed.scaResult.success) {
        return null;
      }
      changeMap[changed.word.id] = changed.scaResult.result;
    }
    const result = await sendPerformMassEditRequest(changeMap, editField, language.id);
    setIsPreviewing(false);
    return result;
  }

  if(changedWords.length === 0) {
    return (
      <p>The given rules do not affect any words in {language.name}'s dictionary.</p>
    );
  }

  return (
    <>
      <p>
        {changedWords.length} word{changedWords.length !== 1 && "s"} found.
      </p>
      <p>
        More fields:
        <EnableDictionaryFieldButtons
          fields={fields}
          setFields={setFields}
        />
      </p>
      {!isSaved && (
        anyScaResultFailed
          ? <p><b>Please fix all SCA errors before saving.</b></p>
          : <SaveChangesButton
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              saveQueryKey={['languages', language.id, 'dictionary-chronosca']}
              saveQueryFn={confirmChanges}
              handleSave={() => setIsSaved(true)}
              style={{ marginBottom: "1em" }}
            >
              Save changes
            </SaveChangesButton>
      )}
      <DictionaryTable>
        <tr>
          <th>Input</th>
          <th>Result</th>
          {fields.map(f => f.isDisplaying && (
            <th key={f.name}>
              {userFacingFieldName(f.name)}
              {f.name !== 'word' && f.name !== 'meaning' && f.name !== editField && (
                <LetterButtonXNoShadow onClick={() => disableField(f)} />
              )}
            </th>
          ))}
        </tr>
        {changedWords.map(changed => (
          <PreviewChangesRow
            word={changed.word}
            fields={displayedFieldNames}
            editField={editField}
            result={changed.scaResult}
            language={language}
            partsOfSpeech={partsOfSpeech}
            key={changed.word.id}
          />
        ))}
      </DictionaryTable>
      {!isSaved && (
        anyScaResultFailed
          ? <p><b>Please fix all SCA errors before saving.</b></p>
          : <SaveChangesButton
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              saveQueryKey={['languages', language.id, 'dictionary-chronosca']}
              saveQueryFn={confirmChanges}
              handleSave={() => setIsSaved(true)}
              style={{ marginTop: "1em" }}
            >
              Save changes
            </SaveChangesButton>
      )}
    </>
  );
}

type ISCAResultsPreviewGetWords = Omit<ISCAResultsPreview, 'words'> & {
  filter: IDictionaryFilter;
};

function SCAResultsPreviewGetWords({
  language, filter, editField, rules, dictSettings, partsOfSpeech, setIsPreviewing
}: ISCAResultsPreviewGetWords) {
  const dictResponse = useLanguageWords(language.id);

  if(dictResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(dictResponse.status === 'error') {
    return <p>Error: {dictResponse.error.message}</p>;
  }

  return (
    <SCAResultsPreview
      language={language}
      words={sortAndFilterWords(dictResponse.data, filter)}
      editField={editField}
      rules={rules}
      dictSettings={dictSettings}
      partsOfSpeech={partsOfSpeech}
      setIsPreviewing={setIsPreviewing}
    />
  );
}

interface IRunDictionarySCAInner {
  language: ILanguage;
  dictSettings: IDictionarySettings;
  partsOfSpeech: IPartOfSpeech[];
}

function RunDictionarySCAInner(
  { language, dictSettings, partsOfSpeech }: IRunDictionarySCAInner
) {
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<IDictionaryFilter>({
    field: '', type: 'begins', value: "", matchCase: false,
    sortField: 'word', sortDir: 'asc'
  });

  const [editField, setEditField] = useState<IEditField>('word');
  const [rules, setRules] = useState("");
  const [message, setMessage] = useState("");

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewFilter, setPreviewFilter] = useState<IDictionaryFilter | null>(null);
  const [previewField, setPreviewField] = useState<IEditField | null>(null);

  const filterFieldNames = getAllFields(dictSettings).flatMap(f => (
    f.name === 'word' ? [] : [f.name]
  ));
  const editFieldNames = dictSettings.showWordIpa ? ['word', 'ipa'] : ['word'];

  function previewChanges() {
    setMessage("");
    setIsPreviewing(true);
    setPreviewFilter(filter);
    setPreviewField(editField);

    queryClient.removeQueries({ queryKey: ['languages', language.id, 'apply-sca-rules'] });
    queryClient.removeQueries({ queryKey: ['languages', language.id, 'words'] });
  }

  function cancelChanges() {
    setIsPreviewing(false);
    setPreviewFilter(null);
    setPreviewField(null);
  }

  return (
    <>
      <h2>Dictionary ChronoSCA</h2>
      <p>
        Run <Link to={'/chronosca/' + language.id}>ChronoSCA</Link> rules on{" "}
        <Link to={'/language/' + language.id}>{language.name}</Link>'s dictionary.
      </p>
      <DictionaryFilterSelect
        fields={filterFieldNames}
        filter={filter}
        setFilter={setFilter}
        disabled={isPreviewing}
      />
      <p>
        Edit field:{" "}
        <select
          value={editField as string}
          onChange={e => setEditField(e.target.value as IEditField)}
          disabled={isPreviewing}
        >
          {editFieldNames.map(field => (
            <option value={field} key={field}>
              {userFacingFieldName(field)}
            </option>
          ))}
        </select>
      </p>
      <h4>Rules:</h4>
      <textarea
        value={rules}
        onChange={e => setRules(e.target.value)}
        disabled={isPreviewing}
        style={{ width: "20em", height: "10em", marginBottom: "1em" }}
      />
      <br />
      {message && <p style={{ marginTop: "0" }}><b>{message}</b></p>}
      {
        isPreviewing
          ? <button onClick={cancelChanges}>Cancel</button>
          : <button onClick={previewChanges}>Preview changes</button>
      }
      {previewFilter && previewField && (
        <SCAResultsPreviewGetWords
          language={language}
          filter={previewFilter}
          editField={previewField}
          rules={rules}
          dictSettings={dictSettings}
          partsOfSpeech={partsOfSpeech}
          setIsPreviewing={setIsPreviewing}
        />
      )}
    </>
  );
}

export default function RunDictionarySCA() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);
  const dictSettingsResponse = useLanguageDictionarySettings(languageId);
  const posResponse = usePartsOfSpeech();

  useSetPageTitle("Dictionary ChronoSCA");

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
    <RunDictionarySCAInner
      language={languageResponse.data}
      dictSettings={dictSettingsResponse.data}
      partsOfSpeech={posResponse.data}
    />
  );
}
