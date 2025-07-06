import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import SaveChangesButton from '@/components/SaveChangesButton';

import { useLanguage } from '@/hooks/languages';
import { useLanguageCategories } from '@/hooks/phones';
import {
  useLanguageDerivationRuleset,
  useLanguageDerivationRulesetIds
} from '@/hooks/words';

import { ILanguage } from '@/types/languages';
import { IDerivationRuleset, IDerivationRulesetOverview } from '@/types/words';

import {
  useGetParamsOrSelectedId,
  useSetPageTitle,
  useUnsavedPopup
} from '@/utils/global/hooks';
import {
  renderDatalessQueryResult,
  sendBackendJson,
  sendBackendRequest
} from '@/utils/global/queries';

import ApplySCARules from './components/ApplySCARules';
import DisplayCategories from './components/DisplayCategories';
import {
  SourceLanguageDisplay,
  SourceLanguageSelect
} from './components/SourceLanguage';

interface IRulesInput {
  destLangId: string;
  srcLangId: string;
  isNewRuleset: boolean;
  ruleset: IDerivationRuleset | null;
  setRuleset: (ruleset: IDerivationRuleset) => void;
  hasEditedRuleset: boolean;
  setHasEditedRuleset: Dispatch<SetStateAction<boolean>>;
}

function RulesInput({
  destLangId, srcLangId, isNewRuleset, ruleset, setRuleset, hasEditedRuleset, setHasEditedRuleset
}: IRulesInput) {
  const rulesetResponse = useLanguageDerivationRuleset(destLangId, srcLangId);

  useUnsavedPopup(hasEditedRuleset);

  useEffect(() => {
    if(!isNewRuleset && !ruleset && rulesetResponse.status === 'success') {
      setRuleset(rulesetResponse.data ?? { rules: "", fromIpa: false });
      setHasEditedRuleset(false);
    }
  }, [isNewRuleset, ruleset, rulesetResponse, setHasEditedRuleset, setRuleset]);

  function updateRules(newRules: string) {
    if(ruleset) {
      setRuleset({ rules: newRules, fromIpa: ruleset.fromIpa });
      setHasEditedRuleset(true);
    }
  }

  if(rulesetResponse.status === 'pending') {
    return "Loading...";
  } else if(rulesetResponse.status === 'error') {
    return rulesetResponse.error.message;
  }

  return (
    <textarea
      value={ruleset?.rules}
      onChange={e => updateRules(e.target.value)}
      style={{ width: "20em", height: "10em" }}
    />
  );
}

interface IDeleteRuleset {
  destLangId: string;
  ruleset: IDerivationRulesetOverview;
  onCancel: () => void;
}

function DeleteRuleset({ destLangId, ruleset, onCancel }: IDeleteRuleset) {
  const queryClient = useQueryClient();

  const [message, setMessage] = useState("");

  async function deleteRuleset() {
    const result = await sendBackendRequest(
      `languages/${destLangId}/derivation-rules/${ruleset.langId}`, 'DELETE'
    );
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }

    queryClient.resetQueries({
      queryKey: ['languages', destLangId, 'derivation-rules']
    });
  }

  return (
    <>
      <h2>Delete Derivation Ruleset</h2>
      <p>
        Really delete the derivation ruleset for{" "}
        <Link to={'/language/' + ruleset.langId}>{ruleset.langName}</Link>?
      </p>
      <p>
        <b>This action cannot be undone!</b>
      </p>
      <button onClick={deleteRuleset} style={{ marginBottom: "15px" }}>
        Delete ruleset
      </button>
      <br />
      <button onClick={onCancel}>
        Go back
      </button>
      {message && <p><b>Error: {message}</b></p>}
    </>
  );
}

interface ITestRuleset {
  srcLangId: string;
  ruleset: IDerivationRuleset;
}

function TestRuleset({ srcLangId, ruleset }: ITestRuleset) {
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");
  const [scaQueryInput, setSCAQueryInput] = useState<string | null>(null);

  const categoryType = ruleset.fromIpa ? 'phone' : 'orth';
  const categoriesResponse = useLanguageCategories(srcLangId, categoryType);

  function applySCARules() {
    const queryKey = ['languages', srcLangId, 'apply-sca-rules'];
    queryClient.resetQueries({ queryKey });
    queryClient.removeQueries({ queryKey });
    setSCAQueryInput(input);
  }

  if(categoriesResponse.status !== 'success') {
    return <p>{categoriesResponse.error?.message ?? "Loading..."}</p>;
  }

  return (
    <>
      <p>You can test this ruleset below. One input per line.</p>
      <h4 style={{ marginTop: "0.5em" }}>Input:</h4>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        style={{ width: "20em", height: "10em" }}
      />

      <h4>Categories:</h4>
      <DisplayCategories
        languageId={srcLangId}
        categories={categoriesResponse.data}
      />

      <p>
        <button onClick={applySCARules}>
          Test rules
        </button>
      </p>
      {scaQueryInput !== null && (
        <>
          <h4>Results:</h4>
          <ApplySCARules
            languageId={srcLangId}
            input={scaQueryInput}
            rules={ruleset.rules}
            categoryType={categoryType}
          />
        </>
      )}
    </>
  );
}

interface IEditDerivationRulesInner {
  language: ILanguage;
  rulesets: IDerivationRulesetOverview[];
}

function EditDerivationRulesInner({ language, rulesets }: IEditDerivationRulesInner) {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const rulesetIdParam = searchParams.get('src');
  const [shouldUseParamRuleset, setShouldUseParamRuleset] = useState(!!rulesetIdParam);

  const [ruleset, setRuleset] = useState<IDerivationRulesetOverview | 'new' | null>(null);
  const newRulesetId = '_new';

  const [languageId, setLanguageId] = useState("");
  const [rulesetData, setRulesetData] = useState<IDerivationRuleset | null>(null);

  const [hasEditedRuleset, setHasEditedRuleset] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isDeletingRuleset, setIsDeletingRuleset] = useState(false);

  const updateRulesetId = useCallback((newId: string | null) => {
    if(hasEditedRuleset && languageId) {
      if(!confirm("This will overwrite any unsaved edits you have made below. Continue?")) {
        return;
      }
    }

    if(newId === null) {
      setRuleset(null);
      return;
    }
    const theRuleset = newId !== newRulesetId && rulesets.find(r => r.langId === newId);
    setRuleset(theRuleset || 'new');
    setLanguageId(newId === newRulesetId ? "" : newId);
    setRulesetData(theRuleset ? null : { rules: "", fromIpa: false });
    setHasEditedRuleset(true);
  }, [hasEditedRuleset, languageId, rulesets]);

  useEffect(() => {
    if(shouldUseParamRuleset && rulesetIdParam) {
      updateRulesetId(rulesetIdParam);
      setShouldUseParamRuleset(false);
    }
  }, [rulesetIdParam, shouldUseParamRuleset, updateRulesetId]);

  function updateDeriveFromIpa(newValue: boolean) {
    if(rulesetData) {
      setRulesetData({ rules: rulesetData.rules, fromIpa: newValue });
      setHasEditedRuleset(true);
    }
  }

  async function sendSaveRulesRequest() {
    if(!rulesetData) {
      return;
    }

    const body = { rules: rulesetData.rules, fromIpa: rulesetData.fromIpa };
    const res = await sendBackendJson(
      `languages/${language.id}/derivation-rules/${languageId}`, 'PUT', body
    );
    if(!res.ok) {
      throw res.body;
    }

    if(ruleset === 'new') {
      queryClient.resetQueries({
        queryKey: ['languages', language.id, 'derivation-rules']
      });
    }
    return res.body;
  }

  if(isDeletingRuleset && ruleset && ruleset !== 'new') {
    return (
      <DeleteRuleset
        destLangId={language.id}
        ruleset={ruleset}
        onCancel={() => setIsDeletingRuleset(false)}
      />
    );
  }

  return (
    <>
      <h2>Edit Derivation Rules</h2>
      <p>Editing derivation rules for <Link to={'/language/' + language.id}>{language.name}</Link>.</p>
      <h4>Ruleset:</h4>
      <select
        value={ruleset === 'new' ? newRulesetId : (ruleset?.langId ?? "")}
        onChange={e => updateRulesetId(e.target.value || null)}
      >
        <option value="">---</option>
        <option value={newRulesetId}>new ruleset</option>
        {rulesets.map(ruleset => (
          <option value={ruleset.langId} key={ruleset.langId}>
            {ruleset.langName} ({ruleset.familyName ?? "isolate"})
          </option>
        ))}
      </select>
      {ruleset && (
        <>
          <h4>Source language:</h4>
          {ruleset === 'new' && rulesetData && (
            <SourceLanguageSelect
              languageId={languageId}
              setLanguageId={setLanguageId}
              deriveFromIpa={rulesetData.fromIpa}
              setDeriveFromIpa={updateDeriveFromIpa}
              rulesets={rulesets}
            />
          )}
          {ruleset !== 'new' && rulesetData && (
            <>
              <SourceLanguageDisplay ruleset={ruleset} />
              <label style={{ display: "block", margin: "1em" }}>
                Derive from:{" "}
                <select
                  value={rulesetData.fromIpa ? "ipa" : "word"}
                  onChange={e => updateDeriveFromIpa(e.target.value === "ipa")}
                >
                  <option value="word">Word</option>
                  <option value="ipa">IPA</option>
                </select>
              </label>
            </>
          )}
          {languageId && (
            <>
              <h4>Rules:</h4>
              <RulesInput
                destLangId={language.id}
                srcLangId={languageId}
                isNewRuleset={ruleset === 'new'}
                ruleset={rulesetData}
                setRuleset={setRulesetData}
                hasEditedRuleset={hasEditedRuleset}
                setHasEditedRuleset={setHasEditedRuleset}
              />
              {hasEditedRuleset && (
                <SaveChangesButton
                  isSaving={isSaving}
                  setIsSaving={setIsSaving}
                  saveQueryKey={[
                    'languages', language.id, 'derivation-rules', languageId, 'update'
                  ]}
                  saveQueryFn={sendSaveRulesRequest}
                  handleSave={() => setHasEditedRuleset(false)}
                  style={{ marginTop: "0.5em" }}
                >
                  Save changes
                </SaveChangesButton>
              )}
              {ruleset !== 'new' && (
                <p style={{ marginTop: hasEditedRuleset ? "0.8em" : "0.5em" }}>
                  <button onClick={() => setIsDeletingRuleset(true)}>
                    Delete ruleset
                  </button>
                </p>
              )}

              {rulesetData && (
                <TestRuleset
                  srcLangId={languageId}
                  ruleset={rulesetData}
                />
              )}
            </>
          )}
        </>
      )}
    </>
  );
}

export default function EditDerivationRules() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);
  const rulesetsResponse = useLanguageDerivationRulesetIds(languageId);

  useSetPageTitle("Edit Derivation Rules");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(rulesetsResponse.status !== 'success') {
    return renderDatalessQueryResult(rulesetsResponse);
  }

  return (
    <EditDerivationRulesInner
      language={languageResponse.data}
      rulesets={rulesetsResponse.data}
    />
  );
}
