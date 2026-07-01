import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import {
  ApplySCARules,
  DisplayCategories,
  SourceLanguageDisplay,
  SourceLanguageSelect
} from '@/components/ChronoSCA';
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
  onDelete: () => void;
}

function DeleteRuleset({ destLangId, ruleset, onCancel, onDelete }: IDeleteRuleset) {
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
    onDelete();
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

function LanguageName({ id }: { id: string }) {
  const languageResponse = useLanguage(id);
  if(languageResponse.status === 'pending') {
    return "Loading...";
  } else if(languageResponse.status === 'error') {
    return "Error: " + languageResponse.error.message;
  } else {
    return languageResponse.data.name;
  }
}

interface ISCAQueryInput {
  input: string;
  rules: string;
  categoryType: 'orth' | 'phone';
}

interface ITestRuleset {
  srcLangId: string;
  rulesetData: IDerivationRuleset;
}

function TestRuleset({ srcLangId, rulesetData }: ITestRuleset) {
  const [input, setInput] = useState("");
  const [scaQueryInput, setSCAQueryInput] = useState<ISCAQueryInput | null>(null);

  const categoryType = rulesetData.fromIpa ? 'phone' : 'orth';
  const categoriesResponse = useLanguageCategories(srcLangId, categoryType);

  function applySCARules() {
    setSCAQueryInput({ input, rules: rulesetData.rules, categoryType });
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
      <p style={{ margin: "0.5em 0" }}>
        Using <LanguageName id={srcLangId} />'s{" "}
        {categoryType === 'phone' ? "phonology" : "orthography"} categories.
      </p>
      {categoriesResponse.status === 'success' && (
        <DisplayCategories
          languageId={srcLangId}
          categories={categoriesResponse.data}
        />
      )}
      {categoriesResponse.status === 'pending' && <p>Loading categories...</p>}
      {categoriesResponse.status === 'error' && (
        <p>Could not load categories: {categoriesResponse.error.message}</p>
      )}

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
            input={scaQueryInput.input}
            rules={scaQueryInput.rules}
            categoryType={scaQueryInput.categoryType}
          />
        </>
      )}
    </>
  );
}

function EditDerivationRulesInner({ language }: { language: ILanguage }) {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const rulesetIdParam = searchParams.get('src');
  const [shouldUseParamRuleset, setShouldUseParamRuleset] = useState(!!rulesetIdParam);

  const [ruleset, setRuleset] = useState<IDerivationRulesetOverview | 'new' | null>(null);
  const newRulesetId = '_new';

  const [justAddedRulesetDestId, setJustAddedRulesetDestId] = useState<string | null>(null);

  const [languageId, setLanguageId] = useState("");
  const [rulesetData, setRulesetData] = useState<IDerivationRuleset | null>(null);

  const [hasEditedRuleset, setHasEditedRuleset] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isDeletingRuleset, setIsDeletingRuleset] = useState(false);

  const rulesetsResponse = useLanguageDerivationRulesetIds(language.id);
  const rulesets = rulesetsResponse.data;

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
    const theRuleset = newId !== newRulesetId && rulesets?.find(r => r.langId === newId);
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

  useEffect(() => {
    if(rulesets && justAddedRulesetDestId !== null) {
      const theRuleset = rulesets.find(r => r.langId === justAddedRulesetDestId);
      if(theRuleset) {
        setRuleset(theRuleset);
      }
      setJustAddedRulesetDestId(null);
    }
  }, [justAddedRulesetDestId, rulesets]);

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
      setJustAddedRulesetDestId(languageId);
      queryClient.resetQueries({
        queryKey: ['languages', language.id, 'derivation-rules']
      });
    }
    return null;
  }

  if(rulesetsResponse.status !== 'success') {
    return renderDatalessQueryResult(rulesetsResponse);
  }

  if(isDeletingRuleset && ruleset && ruleset !== 'new') {
    return (
      <DeleteRuleset
        destLangId={language.id}
        ruleset={ruleset}
        onCancel={() => setIsDeletingRuleset(false)}
        onDelete={() => {
          setRuleset(null);
          setIsDeletingRuleset(false);
        }}
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
        {rulesets!.map(ruleset => (
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
              rulesets={rulesets!}
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
              <p style={{ marginTop: "0.5em" }}>
                For help, see the <Link to="/chronosca-help">ChronoSCA help page</Link>.
              </p>
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
                  rulesetData={rulesetData}
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

  useSetPageTitle("Edit Derivation Rules");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  return (
    <EditDerivationRulesInner language={languageResponse.data} />
  );
}
