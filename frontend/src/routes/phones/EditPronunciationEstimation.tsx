import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { DisplayCategories } from '@/components/ChronoSCA';
import SaveChangesButton from '@/components/SaveChangesButton';
import { SettingsTable } from '@/components/SettingsTable';

import { useLanguage } from '@/hooks/languages';
import {
  useEstimateWordIPAQuery,
  useLanguagePhoneCategories,
  useLanguagePronunciationEstimationSettings
} from '@/hooks/phones';

import { ILanguage } from '@/types/languages';
import { IPronunciationEstimationSettings } from '@/types/phones';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

async function sendSaveSettingsRequest(letterReplacements: string, rewriteRules: string, langId: string) {
  const reqBody = { letterReplacements, rewriteRules };
  const res = await sendBackendJson(`languages/${langId}/pronunciation-estimation`, 'PUT', reqBody);
  if(!res.ok) {
    throw res.body;
  }
  return res.body;
}

function EstimationQueryResultsRow({ languageId, inputLine }: { languageId: string, inputLine: string }) {
  const scaQuery = useEstimateWordIPAQuery(languageId, inputLine);
  return (
    <tr>
      <td>{inputLine}</td>
      <td>
        {scaQuery.status === 'success' && scaQuery.data}
        {scaQuery.status === 'pending' && "Loading..."}
        {scaQuery.status === 'error' && (
          <span style={{ color: "red" }}>{scaQuery.error.message}</span>
        )}
      </td>
    </tr>
  );
}

function EstimationQueryResults({ languageId, inputs }: { languageId: string, inputs: string[] }) {
  return (
    <SettingsTable>
      <tr style={{ textAlign: "left" }}>
        <th>Input</th>
        <th>Output</th>
      </tr>
      {inputs.map((line, i) => (
        <EstimationQueryResultsRow
          languageId={languageId}
          inputLine={line}
          key={i}
        />
      ))}
    </SettingsTable>
  );
}

interface IEstimationQueryInput {
  inputs: string[];
  rules: string;
}

function TestPronunciationEstimation({ language, rules }: { language: ILanguage, rules: string }) {
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");
  const [queryInput, setQueryInput] = useState<IEstimationQueryInput | null>(null);

  const categoriesResponse = useLanguagePhoneCategories(language.id);

  function estimatePronunciation() {
    setQueryInput({ inputs: input.length > 0 ? input.split("\n") : [], rules });
    queryClient.resetQueries({
      queryKey: ['languages', language.id, 'estimate-ipa']
    });
  }

  return (
    <>
      <h3>Test Pronunciation Estimation</h3>
      <p>One input per line. You must first save your changes above for them to take effect here.</p>

      <h4>Input:</h4>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        style={{ width: "20em", height: "10em" }}
      />

      <h4>Categories:</h4>
      {categoriesResponse.status === 'success' && (
        <DisplayCategories
          languageId={language.id}
          categories={categoriesResponse.data}
        />
      )}

      <p>
        <button onClick={estimatePronunciation}>
          Estimate
        </button>
      </p>
      {queryInput !== null && (
        <>
          <h4>Results:</h4>
          <EstimationQueryResults
            languageId={language.id}
            inputs={queryInput.inputs}
          />
        </>
      )}
    </>
  );
}

interface IEditPronunciationEstimationInner {
  language: ILanguage;
  initialSettings: IPronunciationEstimationSettings;
}

function EditPronunciationEstimationInner({ language, initialSettings }: IEditPronunciationEstimationInner) {
  const [letterReplacements, setLetterReplacements] = useState(
    initialSettings.letterReplacements
  );
  const [rewriteRules, setRewriteRules] = useState(initialSettings.rewriteRules);

  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <>
      <h2>Edit Pronunciation Estimation</h2>
      <p>
        Editing <Link to={'/language/' + language.id}>{language.name}</Link>'s
        pronunciation estimation.
      </p>
      <h4>Rewrite Rules</h4>
      <p>
        Rewrite the generated IPA after initial estimation using ChronoSCA rules. For help, see the{" "}
        <Link to="/chronosca-help">ChronoSCA help page</Link>.
      </p>
      <textarea
        value={rewriteRules}
        onChange={e => {
          setRewriteRules(e.target.value);
          setIsSaved(false);
        }}
        style={{ width: "20em", height: "10em" }}
      />
      {!isSaved && (
        <SaveChangesButton
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          saveQueryKey={['languages', language.id, 'pronunciation-estimation', 'update']}
          saveQueryFn={async () => {
            return await sendSaveSettingsRequest(letterReplacements, rewriteRules, language.id);
          }}
          handleSave={() => setIsSaved(true)}
          style={{ marginTop: "0.8em" }}
        >
          Save
        </SaveChangesButton>
      )}
      <h4>Pre-Rewrite Replacements</h4>
      <p>Change how letters are converted to IPA during initial estimation.</p>
      <p>Format: <code>letter|estimation</code> (one per line)</p>
      <textarea
        value={letterReplacements}
        onChange={e => {
          setLetterReplacements(e.target.value);
          setIsSaved(false);
        }}
        style={{ width: "20em", height: "10em" }}
      />
      {!isSaved && (
        <SaveChangesButton
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          saveQueryKey={['languages', language.id, 'pronunciation-estimation', 'update']}
          saveQueryFn={async () => {
            return await sendSaveSettingsRequest(letterReplacements, rewriteRules, language.id);
          }}
          handleSave={() => setIsSaved(true)}
          style={{ marginTop: "0.8em" }}
        >
          Save
        </SaveChangesButton>
      )}

      <TestPronunciationEstimation
        language={language}
        rules={rewriteRules}
      />
    </>
  );
}

export default function EditPronunciationEstimation() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);
  const settingsResponse = useLanguagePronunciationEstimationSettings(languageId);

  useSetPageTitle("Pronunciation Estimation");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(settingsResponse.status !== 'success') {
    return renderDatalessQueryResult(settingsResponse);
  }

  return (
    <EditPronunciationEstimationInner
      language={languageResponse.data}
      initialSettings={settingsResponse.data}
    />
  );
}
