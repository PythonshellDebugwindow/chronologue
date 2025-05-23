import { useState } from 'react';
import { Link } from 'react-router-dom';

import SaveChangesButton from '@/components/SaveChangesButton';

import { useLanguage } from '@/hooks/languages';
import { useLanguagePronunciationEstimationSettings } from '@/hooks/phones';

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
        Rewrite the generated IPA after initial estimation using ChronoSCA rules. Rules can be
        tested on the <Link to={'/chronosca/' + language.id}>ChronoSCA testing page</Link>.
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
