import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { CSelect } from '@/components/CForm';
import SaveChangesButton from '@/components/SaveChangesButton';

import { useFamilies, useFamilyMembers } from '@/hooks/families';
import { useLanguage } from '@/hooks/languages';
import {
  useLanguageDerivationRuleset,
  useLanguageDerivationRulesetIds
} from '@/hooks/words';

import { ILanguage } from '@/types/languages';
import { IDerivationRuleset, IDerivationRulesetOverview } from '@/types/words';

import { useGetParamsOrSelectedId, useUnsavedPopup } from '@/utils/global/hooks';
import {
  renderDatalessQueryResult,
  sendBackendJson,
  sendBackendRequest
} from '@/utils/global/queries';

import styles from './EditDerivationRules.module.css';

interface ISourceLanguageSelectInner {
  familyId: string;
  languageId: string;
  setLanguageId: Dispatch<SetStateAction<string>>;
  rulesets: IDerivationRulesetOverview[];
}

function SourceLanguageSelectInner(
  { familyId, languageId, setLanguageId, rulesets }: ISourceLanguageSelectInner
) {
  const { isPending, error, data: allLanguages } = useFamilyMembers(familyId || null);
  const languages = allLanguages?.filter(lang => !rulesets.some(r => r.langId === lang.id));

  useEffect(() => {
    if(!languageId && languages && languages.length > 0) {
      setLanguageId(languages[0].id);
    }
  }, [languageId, languages, setLanguageId]);

  if(isPending || error || !languages) {
    return (
      <tr>
        <td>Language:</td>
        <td>{isPending ? "Loading..." : error?.message}</td>
      </tr>
    );
  }

  return (
    <CSelect
      label="Language"
      name="language"
      state={languageId}
      setState={setLanguageId}
    >
      {
        languages.length > 0
          ? languages.map(language => (
              <option value={language.id} key={language.id}>{language.name}</option>
            ))
          : <option value="">(none found)</option>
      }
    </CSelect>
  );
}

interface ISourceLanguageSelect {
  languageId: string;
  setLanguageId: Dispatch<SetStateAction<string>>;
  deriveFromIpa: boolean;
  setDeriveFromIpa: (deriveFromIpa: boolean) => void;
  rulesets: IDerivationRulesetOverview[];
}

function SourceLanguageSelect(
  { languageId, setLanguageId, deriveFromIpa, setDeriveFromIpa, rulesets }: ISourceLanguageSelect
) {
  const [familyId, setFamilyId] = useState("");

  const { isPending, error, data: families } = useFamilies();
  if(isPending) {
    return "Loading...";
  } else if(error) {
    return error.message;
  }

  function setFamilyIdWrapper(id: string) {
    setFamilyId(id);
    setLanguageId("");
  }

  return (
    <table className={styles.rulesetLanguageTable}>
      <tbody>
        <CSelect
          label="Family"
          name="family"
          state={familyId}
          setState={setFamilyIdWrapper}
        >
          <option value="">(isolates)</option>
          {families.map(family => (
            <option value={family.id} key={family.id}>
              {family.name}
            </option>
          ))}
        </CSelect>
        <SourceLanguageSelectInner
          familyId={familyId}
          languageId={languageId}
          setLanguageId={setLanguageId}
          rulesets={rulesets}
        />
        {languageId && (
          <CSelect
            label="Derive from"
            name="deriveFrom"
            state={deriveFromIpa ? "ipa" : "word"}
            setState={e => setDeriveFromIpa(e === "ipa")}
          >
            <option value="word">Word</option>
            <option value="ipa">IPA</option>
          </CSelect>
        )}
      </tbody>
    </table>
  );
}

function SourceLanguageDisplay({ ruleset }: { ruleset: IDerivationRulesetOverview }) {
  return (
    <table className={styles.rulesetLanguageTable}>
      <tbody>
        <tr>
          <td>Family:</td>
          <td>
            {
              ruleset.familyId
                ? <Link to={'/family/' + ruleset.familyId}>{ruleset.familyName}</Link>
                : "(isolate)"
            }
          </td>
        </tr>
        <tr>
          <td>Language:</td>
          <td>
            <Link to={'/language/' + ruleset.langId}>{ruleset.langName}</Link>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

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
  }, [
    isNewRuleset, rulesetResponse.data, rulesetResponse.status,
    setHasEditedRuleset, setRuleset
  ]);

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

interface IEditDerivationRulesInner {
  language: ILanguage;
  rulesets: IDerivationRulesetOverview[];
}

function EditDerivationRulesInner({ language, rulesets }: IEditDerivationRulesInner) {
  const queryClient = useQueryClient();

  const [ruleset, setRuleset] = useState<IDerivationRulesetOverview | 'new' | null>(null);
  const newRulesetId = '_new';

  const [languageId, setLanguageId] = useState("");
  const [rulesetData, setRulesetData] = useState<IDerivationRuleset | null>(null);

  const [hasEditedRuleset, setHasEditedRuleset] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isDeletingRuleset, setIsDeletingRuleset] = useState(false);

  function updateDeriveFromIpa(newValue: boolean) {
    if(rulesetData) {
      setRulesetData({ rules: rulesetData.rules, fromIpa: newValue });
      setHasEditedRuleset(true);
    }
  }

  function updateRulesetId(newId: string | null) {
    if(hasEditedRuleset && languageId) {
      if(!confirm("This will overwrite any unsaved edits you have made below. Continue?")) {
        return;
      }
    }

    if(newId === newRulesetId) {
      setRuleset('new');
      setLanguageId("");
      setRulesetData({ rules: "", fromIpa: false });
      setHasEditedRuleset(true);
    } else if(newId === null) {
      setRuleset(null);
    } else {
      setRuleset(rulesets.find(r => r.langId === newId) ?? null);
      setRulesetData(null);
      setLanguageId(newId);
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
              <p>
                <button onClick={() => setIsDeletingRuleset(true)}>
                  Delete ruleset
                </button>
              </p>
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
