import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { CSelect } from '@/components/CForm';
import SaveChangesButton from '@/components/SaveChangesButton';

import { useFamilies, useFamilyMembers } from '@/hooks/families';
import { useLanguage } from '@/hooks/languages';
import {
  useLanguageDerivationRules,
  useLanguageDerivationRulesetIds
} from '@/hooks/words';

import { ILanguage } from '@/types/languages';
import { IDerivationRulesetOverview } from '@/types/words';

import { useGetParamsOrSelectedId, useUnsavedPopup } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

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
  rulesets: IDerivationRulesetOverview[];
}

function SourceLanguageSelect({ languageId, setLanguageId, rulesets }: ISourceLanguageSelect) {
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
  rules: string;
  setRules: Dispatch<SetStateAction<string>>;
}

function RulesInput({ destLangId, srcLangId, isNewRuleset, rules, setRules }: IRulesInput) {
  const queryClient = useQueryClient();

  const rulesResponse = useLanguageDerivationRules(destLangId, srcLangId);

  const [rulesAreSaved, setRulesAreSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useUnsavedPopup(!rulesAreSaved);

  useEffect(() => {
    if(!isNewRuleset && rulesResponse.status === 'success') {
      setRules(rulesResponse.data ?? "");
      setRulesAreSaved(true);
    }
  }, [isNewRuleset, rulesResponse.data, rulesResponse.status, setRules]);

  function updateRules(newRules: string) {
    setRules(newRules);
    setRulesAreSaved(false);
  }

  async function sendSaveRulesRequest() {
    const res = await sendBackendJson(
      `languages/${destLangId}/derivation-rules/${srcLangId}`, 'PUT', { rules }
    );
    if(!res.ok) {
      throw res.body;
    }

    if(isNewRuleset) {
      queryClient.resetQueries({ queryKey: ['languages', destLangId, 'derivation-rules'] });
    }
    return res.body;
  }

  if(rulesResponse.status === 'pending') {
    return "Loading...";
  } else if(rulesResponse.status === 'error') {
    return rulesResponse.error.message;
  }

  return (
    <>
      <textarea
        value={rules}
        onChange={e => updateRules(e.target.value)}
        style={{ width: "20em", height: "10em" }}
      />
      {!rulesAreSaved && (
        <SaveChangesButton
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          saveQueryKey={['languages', destLangId, 'derivation-rules', srcLangId, 'update']}
          saveQueryFn={sendSaveRulesRequest}
          handleSave={() => setRulesAreSaved(true)}
          style={{ marginTop: "0.5em" }}
        >
          Save changes
        </SaveChangesButton>
      )}
    </>
  );
}

interface IEditDerivationRulesInner {
  language: ILanguage;
  rulesets: IDerivationRulesetOverview[];
}

function EditDerivationRulesInner({ language, rulesets }: IEditDerivationRulesInner) {
  const [ruleset, setRuleset] = useState<IDerivationRulesetOverview | 'new' | null>(null);
  const newRulesetId = '_new';

  const [languageId, setLanguageId] = useState("");
  const [rules, setRules] = useState("");

  function updateRulesetId(newId: string | null) {
    if(newId === newRulesetId) {
      setRuleset('new');
      setLanguageId("");
      setRules("");
    } else if(newId === null) {
      setRuleset(null);
    } else {
      setRuleset(rulesets.find(r => r.langId === newId) ?? null);
      setLanguageId(newId);
    }
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
          {ruleset === 'new' && (
            <SourceLanguageSelect
              languageId={languageId}
              setLanguageId={setLanguageId}
              rulesets={rulesets}
            />
          )}
          {ruleset !== 'new' && (
            <SourceLanguageDisplay ruleset={ruleset} />
          )}
          {languageId && (
            <>
              <h4>Rules:</h4>
              <RulesInput
                destLangId={language.id}
                srcLangId={languageId}
                isNewRuleset={ruleset === 'new'}
                rules={rules}
                setRules={setRules}
              />
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
