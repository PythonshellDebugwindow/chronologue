import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CSelect } from '@/components/CForm';

import { useFamilies, useFamilyMembers } from '@/hooks/families';
import { useLanguage } from '@/hooks/languages';

import { IDerivationRulesetOverview } from '@/types/words';

import styles from './SourceLanguage.module.css';

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

export function SourceLanguageSelect(
  { languageId, setLanguageId, deriveFromIpa, setDeriveFromIpa, rulesets }: ISourceLanguageSelect
) {
  const [familyId, setFamilyId] = useState("");

  const familiesQuery = useFamilies();

  const paramLanguageQuery = useLanguage(languageId, languageId !== "");

  useEffect(() => {
    if(paramLanguageQuery.data) {
      setFamilyId(paramLanguageQuery.data.familyId ?? "");
    }
  }, [paramLanguageQuery]);

  function setFamilyIdWrapper(id: string) {
    setFamilyId(id);
    setLanguageId("");
  }

  if(familiesQuery.isPending) {
    return "Loading...";
  } else if(familiesQuery.error) {
    return familiesQuery.error.message;
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
          {familiesQuery.data.map(family => (
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

export function SourceLanguageDisplay({ ruleset }: { ruleset: IDerivationRulesetOverview }) {
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
