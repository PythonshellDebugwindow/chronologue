import { Link, useParams } from 'react-router-dom';

import DisplayDate from '@/components/DisplayDate';
import InfoTable from '@/components/InfoTable';
import { FamilyTree } from '@/components/LanguageTree';
import { UserNotesParagraph } from '@/components/Paragraphs';

import { useFamily } from '@/hooks/families';

import { IFamily } from '@/types/families';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

function ViewFamilyInner({ family }: { family: IFamily }) {
  return (
    <>
      <h2>View Family: {family.name}</h2>
      <InfoTable>
        <tr>
          <th>Created:</th>
          <td>
            <DisplayDate date={family.created} />
          </td>
        </tr>
      </InfoTable>
      {family.description && (
        <UserNotesParagraph>
          {family.description}
        </UserNotesParagraph>
      )}
      <p><Link to={'/edit-family/' + family.id}>Edit family</Link></p>
      <h3>Languages</h3>
      <FamilyTree id={family.id} showSelect />
    </>
  );
}

export default function ViewFamily() {
  const { id } = useParams();
  if(!id) {
    throw new Error("No family ID was provided");
  }

  const familyResponse = useFamily(id);

  const family = familyResponse.data;
  useSetPageTitle(family ? "Family: " + family.name : "View Family");

  if(familyResponse.status !== 'success') {
    return renderDatalessQueryResult(familyResponse);
  }

  return <ViewFamilyInner family={familyResponse.data} />;
}
