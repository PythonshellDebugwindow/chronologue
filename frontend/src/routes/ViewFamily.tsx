import { Link, useParams } from 'react-router-dom';

import DisplayDate from '../components/DisplayDate.tsx';
import { FamilyTree } from '../components/LanguageTree.tsx';

import { getFamilyById } from '../familyData.tsx';
import { useSetPageTitle } from '../utils.tsx';

export default function ViewFamily() {
  const { id } = useParams();
  if(!id) {
    throw new Error("No family ID was provided");
  }
  const { isPending, error, data: family } = getFamilyById(id);
  
  useSetPageTitle(family ? "Family: " + family.name : "View family");

  if(isPending) {
    return <p>Loading...</p>;
  } else if(error) {
    return (
      <>
        <h2>{ error.title }</h2>
        <p>{ error.message }</p>
      </>
    );
  } else {
    return (
      <>
        <h2>View Family: { family.name }</h2>
        <table className="info-table">
        <tbody>
          <tr>
            <th>Created:</th>
            <td>
              <DisplayDate date={ family.created } />
            </td>
          </tr>
        </tbody>
      </table>
      { family.description && <p>{ family.description }</p> }
      <p><Link to={ '/edit-family/' + id }>Edit family</Link></p>
      <h3>Languages</h3>
      <FamilyTree id={ family.id } showSelect={true} />
      </>
    )
  };
};
