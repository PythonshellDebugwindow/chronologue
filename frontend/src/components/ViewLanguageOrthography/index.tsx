import { Link } from 'react-router-dom';

import { UserNotesParagraph } from '../Paragraphs';
import { GraphTableCell, PhoneTable } from '../PhoneTable';

import { useLanguageOrthographySettings } from '@/hooks/languages';
import { useLanguagePhones } from '@/hooks/phones';

import { IOrthographySettings } from '@/types/languages';
import { IPhone } from '@/types/phones';

import { renderDatalessQueryResult } from '@/utils/global/queries';
import { formatGraphForAlphabet, phoneToStringWithBrackets } from '@/utils/phones';

interface IGraphCell {
  phones: IPhone[];
  orthSettings: IOrthographySettings;
}

function GraphCell({ phones, orthSettings }: IGraphCell) {
  return (
    <GraphTableCell style={{ background: "#fafafa" }}>
      <big>{formatGraphForAlphabet(phones[0].graph, orthSettings)}</big>
      <br />
      {phones.map(phoneToStringWithBrackets).sort().join(", ")}
    </GraphTableCell>
  );
}

function renderOrthographyTableRows(phones: IPhone[], orthSettings: IOrthographySettings) {
  const phonesByGraph = Object.groupBy(phones, p => p.graph);
  const graphs = orthSettings.alphabeticalOrder;
  const rows = [];
  for(let i = 0; i < graphs.length; i += 10) {
    rows.push(
      <tr key={i}>
        {graphs.slice(i, i + 10).map((g, j) => (
          <GraphCell
            phones={phonesByGraph[g]!}
            orthSettings={orthSettings}
            key={j}
          />
        ))}
      </tr>
    );
  }
  return rows;
}

interface IOrthographyTableInner {
  phones: IPhone[];
  orthSettings: IOrthographySettings;
  languageId: string;
}

function OrthographyTableInner({ phones, orthSettings, languageId }: IOrthographyTableInner) {
  return (
    <PhoneTable style={{ border: "1px solid #999", marginTop: "10px" }}>
      {renderOrthographyTableRows(phones, orthSettings)}
      <tr>
        <td colSpan={10} style={{ paddingLeft: "5px", paddingRight: "5px" }}>
          {
            orthSettings.hasSetAlphabeticalOrder
              ? "Shown in correct order "
              : "Order not set "
          }
          <Link to={'/orthography-settings/' + languageId}>[change]</Link>
        </td>
      </tr>
    </PhoneTable>
  );
}

export function OrthographySection({ languageId, notes }: { languageId: string, notes: string }) {
  const phonesResponse = useLanguagePhones(languageId);
  const orthSettingsResponse = useLanguageOrthographySettings(languageId);

  if(phonesResponse.status !== 'success') {
    return renderDatalessQueryResult(phonesResponse);
  }

  if(orthSettingsResponse.status !== 'success') {
    return renderDatalessQueryResult(orthSettingsResponse);
  }

  const phonesWithGraphs = phonesResponse.data.filter(p => p.graph);
  if(phonesWithGraphs.length === 0 && !notes) {
    return null;
  }

  return (
    <>
      <h3>Orthography</h3>
      {phonesWithGraphs.length > 0 && (
        <OrthographyTableInner
          phones={phonesWithGraphs}
          orthSettings={orthSettingsResponse.data}
          languageId={languageId}
        />
      )}
      {notes && (
        <>
          <h4>Notes</h4>
          <UserNotesParagraph marginTop="0">{notes}</UserNotesParagraph>
        </>
      )}
    </>
  );
}
