import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { FamilyTree } from '../components/LanguageTree.tsx';

import { getFamilies, getLanguageIsolates } from '../familyData.tsx';
import { useSetPageTitle } from '../utils.tsx';

function LanguageIsolates() {
  const { isPending, error, data: languages } = getLanguageIsolates();

  if(isPending) {
    return <p>Loading...</p>
  } else if(error) {
    return (
      <>
        <h3>Isolates</h3>
        <p>{ error.message }</p>
      </>
    );
  }
  
  if(languages.length === 0) {
    return null;
  }
  
  languages.sort((lang1, lang2) => lang1.name.localeCompare(lang2.name));

  return (
    <>
      <h3>Isolates</h3>
      <ul className="language-tree-root">
        {
          languages.map(lang => (
            <li key={ lang.id }>
              <Link to={ '/language/' + lang.id }>
                { lang.name }
              </Link>
            </li>
          ))
        }
      </ul>
    </>
  );
}

export default function ViewLanguages() {
  const { isPending, error, data: families } = getFamilies();
  useSetPageTitle("View Languages");
  
  if(isPending) {
    return <p>Loading...</p>;
  } else if(error) {
    return (
      <>
        <h2>{ error.title }</h2>
        <p>{ error.message }</p>
      </>
    );
  }

  families.sort((f1, f2) => f1.name.localeCompare(f2.name));
  
  return (
    <>
      <h2>View Languages</h2>
      {
        families.map(family => (
          <Fragment key={ family.id }>
            <h3><Link to={ '/family/' + family.id }>{ family.name }</Link></h3>
            <FamilyTree id={ family.id } showSelect={false} />
          </Fragment>
        ))
      }
      <LanguageIsolates />
    </>
  )
};
