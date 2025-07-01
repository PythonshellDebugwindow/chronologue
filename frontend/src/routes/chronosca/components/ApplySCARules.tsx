import { SettingsTable } from '@/components/SettingsTable';

import { useApplySCARulesQuery } from '@/hooks/phones';

import { ApplySCARulesQueryResult } from '@/types/phones';

interface ISCAQueryResults {
  inputs: string[];
  queryResults: ApplySCARulesQueryResult[];
}

function SCAQueryResults({ inputs, queryResults }: ISCAQueryResults) {
  return (
    <SettingsTable>
      <tr style={{ textAlign: "left" }}>
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
    </SettingsTable>
  );
}

interface IApplySCARules {
  languageId: string;
  input: string;
  rules: string;
  categoryType: 'orth' | 'phone';
}

export default function ApplySCARules({ languageId, input, rules, categoryType }: IApplySCARules) {
  const scaQuery = useApplySCARulesQuery(
    languageId, input.split("\n"), rules, categoryType, true
  );

  if(scaQuery.status === 'pending') {
    return <p>Loading...</p>;
  } else if(scaQuery.status === 'error') {
    return <p>Error: {scaQuery.error.message}</p>;
  }

  return (
    <SCAQueryResults
      inputs={input.split("\n")}
      queryResults={scaQuery.data}
    />
  );
}
