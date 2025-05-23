import { Link, useParams } from 'react-router-dom';

import DisplayDate from '@/components/DisplayDate';
import { FamilyTree } from '@/components/LanguageTree';

import { useFamily } from '@/hooks/families';

import { IFamily } from '@/types/families';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

function ViewFamilyInner({ family }: { family: IFamily }) {
  return (
    <>
      <h2>View Family: {family.name}</h2>
      <table className="info-table">
        <tbody>
          <tr>
            <th>Created:</th>
            <td>
              <DisplayDate date={family.created} />
            </td>
          </tr>
        </tbody>
      </table>
      {family.description && (
        <p className="user-notes-paragraph" style={{ marginTop: "1em" }}>
          {family.description}
        </p>
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
