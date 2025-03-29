import { Link } from 'react-router-dom';

import { getOrthographySettings, IOrthographySettings } from '../languageData.tsx';
import {
  formatGraphForAlphabet, getPhonesByLanguage, phoneToStringWithBrackets, IPhone
} from '../phoneData.tsx';

interface IGraphCell {
  phones: IPhone[];
  orthSettings: IOrthographySettings;
}

function GraphCell({ phones, orthSettings }: IGraphCell) {
  return (
    <td className="graph-cell" style={{ background: "#fafafa" }}>
      <big>{ formatGraphForAlphabet(phones[0].graph, orthSettings) }</big>
      <br />
      { phones.map(phoneToStringWithBrackets).sort().join(", ") }
    </td>
  );
}

interface IOrthographyTableInner {
  phones: IPhone[];
  orthSettings: IOrthographySettings;
  languageId: string;
}

function OrthographyTableInner({ phones, orthSettings, languageId }: IOrthographyTableInner) {
  const phonesByGraph = Object.groupBy(phones, p => p.graph);
  const graphs = orthSettings.alphabeticalOrder;
  const rows = [];
  for(let i = 0; i < graphs.length; i += 10) {
    rows.push(
      <tr key={i}>
        {
          graphs.slice(i, i + 10).map(
            (g, j) => (
              <GraphCell
                phones={ phonesByGraph[g]! }
                orthSettings={orthSettings}
                key={j}
              />
            )
          )
        }
      </tr>
    );
  }
  
  return (
    <table className="phone-table" style={{ border: "1px solid #999", marginTop: "10px" }}>
      <tbody>
        { rows }
        <tr>
          <td colSpan={10} style={{ paddingLeft: "5px", paddingRight: "5px" }}>
            { orthSettings.hasSetAlphabeticalOrder ? "Shown in correct order " : "Order not set " }
            <Link to={ '/orthography-settings/' + languageId }>[change]</Link>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function OrthographySection({ languageId }: { languageId: string }) {
  const phonesResponse = getPhonesByLanguage(languageId);
  const orthSettingsResponse = getOrthographySettings(languageId);

  if(phonesResponse.status === 'pending') {
    return <p>Loading phones...</p>;
  } else if(phonesResponse.status === 'error') {
    return (
      <p>{ phonesResponse.error.message }</p>
    );
  }
  if(orthSettingsResponse.status === 'pending') {
    return <p>Loading orthography settings...</p>;
  } else if(orthSettingsResponse.status === 'error') {
    return (
      <p>{ orthSettingsResponse.error.message }</p>
    );
  }
  
  const phonesWithGraphs = phonesResponse.data.filter(p => p.graph);
  if(phonesWithGraphs.length === 0) {
    return null;
  }
  
  return (
    <>
      <h3>Orthography</h3>
      <OrthographyTableInner
        phones={phonesWithGraphs}
        orthSettings={ orthSettingsResponse.data }
        languageId={languageId}
      />
    </>
  );
};
