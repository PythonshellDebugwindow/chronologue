import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { useLanguage } from '@/hooks/languages';
import {
  useLanguageOrthographyCategories,
  useLanguagePhoneCategories
} from '@/hooks/phones';

import { ILanguage } from '@/types/languages';
import { ICategory } from '@/types/phones';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

import ApplySCARules from './components/ApplySCARules';
import DisplayCategories from './components/DisplayCategories';

interface ITestChronoSCAInner {
  language: ILanguage;
  orthCategories: ICategory[];
  phoneCategories: ICategory[];
}

function TestChronoSCAInner({ language, orthCategories, phoneCategories }: ITestChronoSCAInner) {
  const queryClient = useQueryClient();

  const [rules, setRules] = useState("");
  const [input, setInput] = useState("");
  const [scaQueryInput, setSCAQueryInput] = useState<string | null>(null);
  const [categoryType, setCategoryType] = useState<'orth' | 'phone'>('orth');

  const currentCategories = categoryType === 'orth' ? orthCategories : phoneCategories;

  function applySCARules() {
    const queryKey = ['languages', language.id, 'apply-sca-rules'];
    queryClient.resetQueries({ queryKey });
    queryClient.removeQueries({ queryKey });
    setSCAQueryInput(input);
  }

  return (
    <>
      <h2>ChronoSCA Testing</h2>
      <p>
        Test ChronoSCA rules for <Link to={'/language/' + language.id}>{language.name}</Link>.
        One input per line.
      </p>
      <p>
        For help, see the <Link to="/chronosca-help">ChronoSCA help page</Link>.
      </p>

      <h4>Rules:</h4>
      <textarea
        value={rules}
        onChange={e => setRules(e.target.value)}
        style={{ width: "20em", height: "10em" }}
      />

      <h4>Input:</h4>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        style={{ width: "20em", height: "10em" }}
      />

      <h4>Categories:</h4>
      <select
        value={categoryType}
        onChange={e => setCategoryType(e.target.value as 'orth' | 'phone')}
        style={{ display: "block", margin: "0.5em auto 0.5em" }}
      >
        <option value="orth">Orthography</option>
        <option value="phone">Phonology</option>
      </select>
      <DisplayCategories
        languageId={language.id}
        categories={currentCategories}
      />

      <p>
        <button onClick={applySCARules}>
          Apply
        </button>
      </p>
      {scaQueryInput !== null && (
        <>
          <h4>Results:</h4>
          <ApplySCARules
            languageId={language.id}
            input={scaQueryInput}
            rules={rules}
            categoryType={categoryType}
          />
        </>
      )}
    </>
  );
}

export default function TestChronoSCA() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);
  const orthCategoriesResponse = useLanguageOrthographyCategories(languageId);
  const phoneCategoriesResponse = useLanguagePhoneCategories(languageId);

  useSetPageTitle("ChronoSCA Testing");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(orthCategoriesResponse.status !== 'success') {
    return renderDatalessQueryResult(orthCategoriesResponse);
  }

  if(phoneCategoriesResponse.status !== 'success') {
    return renderDatalessQueryResult(phoneCategoriesResponse);
  }

  return (
    <TestChronoSCAInner
      language={languageResponse.data}
      orthCategories={orthCategoriesResponse.data}
      phoneCategories={phoneCategoriesResponse.data}
    />
  );
}
