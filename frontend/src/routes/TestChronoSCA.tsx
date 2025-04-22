import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useLanguage, ILanguage } from '../languageData.tsx';
import {
  renderDatalessQueryResult, useGetParamsOrSelectedId, useSetPageTitle
} from '../utils.tsx';
import {
  useLanguageOrthographyCategories, useLanguagePhoneCategories, useApplySCARulesQuery,
  ApplySCARulesQueryResult, ICategory
} from '../phoneData.tsx';
import { useQueryClient } from '@tanstack/react-query';

function DisplayCategories({ categories }: { categories: ICategory[] }) {
  return (
    <table className="settings-table">
      <tbody>
        {categories.map(category => (
          <tr key={category.letter}>
            <td>{category.letter}</td>
            <td>
              <input
                value={category.members.join(",")}
                disabled
                style={{ color: "black" }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ScaQueryResults(
  { inputs, queryResults }: { inputs: string[], queryResults: ApplySCARulesQueryResult[] }
) {
  return (
    <table style={{ textAlign: "left" }} className="settings-table">
      <tbody>
        <tr>
          <th>Input</th>
          <th>Output</th>
        </tr>
        {queryResults.map((qr, i) => (
          <tr key={i}>
            <td>{inputs[i]}</td>
            <td style={qr.success ? undefined : { color: "red" }}>
              {qr.success ? qr.result : qr.message}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface ITestChronoSCAInner {
  language: ILanguage;
  orthCategories: ICategory[];
  phoneCategories: ICategory[];
}

function TestChronoSCAInner({ language, orthCategories, phoneCategories }: ITestChronoSCAInner) {
  const queryClient = useQueryClient();

  const [rules, setRules] = useState("");
  const [input, setInput] = useState("");
  const [lastInput, setLastInput] = useState("");
  const [categoryType, setCategoryType] = useState<'orth' | 'phone'>('orth');
  const [queryIsEnabled, setQueryIsEnabled] = useState(false);

  const scaQuery = useApplySCARulesQuery(
    language.id, input.split("\n"), rules, categoryType, queryIsEnabled
  );
  const queryResults = (() => {
    if(!queryIsEnabled) {
      return null;
    } else if(scaQuery.status === 'pending') {
      return <p>Loading...</p>;
    } else if(scaQuery.status === 'error') {
      return <p>Error: {scaQuery.error.message}</p>;
    } else {
      return (
        <ScaQueryResults
          inputs={lastInput.split("\n")}
          queryResults={scaQuery.data}
        />
      );
    }
  })();

  const currentCategories = categoryType === 'orth' ? orthCategories : phoneCategories;

  function applySCARules() {
    setLastInput(input);
    setQueryIsEnabled(true);
    queryClient.resetQueries({ queryKey: ['languages', language.id, 'apply-sca-rules'] });
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
      {
        currentCategories.length > 0
          ? <DisplayCategories categories={currentCategories} />
          : <p>No categories set</p>
      }
      <p style={{ marginTop: "0.4em" }}>
        <small>
          <Link to={'/edit-categories/' + language.id}>[edit categories]</Link>
        </small>
      </p>

      <p>
        <button onClick={applySCARules}>
          Apply
        </button>
      </p>
      {queryResults && (
        <>
          <h4>Results:</h4>
          {queryResults}
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
};
