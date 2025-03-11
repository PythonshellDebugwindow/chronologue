import { useContext } from 'react';
import { Link } from 'react-router-dom';

import { getFamilyMembers } from '../familyData.tsx';
import { getDescendants, ILanguage } from '../languageData.tsx';
import SelectedLanguageContext from '../SelectedLanguageContext.tsx';

interface ILanguageTreeBranch {
  root: ILanguage;
  descendants: ILanguage[];
  showSelect: boolean;
}

function AllChildBranches({ root, descendants, showSelect }: ILanguageTreeBranch) {
  const directChildren = descendants.filter(language => language.parentId === root.id);
  const childBranches = directChildren.map(language => (
    <LanguageTreeBranch
      root={language}
      descendants={descendants}
      showSelect={showSelect}
      key={language.id}
    />
  ));
  return directChildren.length > 0 ? <ul>{childBranches}</ul> : null;
}

function LanguageTreeBranch({ root, descendants, showSelect }: ILanguageTreeBranch) {
  const { selectedLanguage, setSelectedLanguage } = useContext(SelectedLanguageContext);
  
  return (
    <li>
      <Link to={ '/language/' + root.id} >
        { root.name }
      </Link>
      {
        showSelect && root.id !== selectedLanguage?.id && (
          <>
            {" "}
            <span style={{ fontSize: "small" }}>
              [
                <Link
                  to={ '/language/' + root.id }
                  onClick={ () => setSelectedLanguage(root) }
                >
                  select
                </Link>
              ]
            </span>
          </>
        )
      }
      <AllChildBranches
        root={root}
        descendants={descendants}
        showSelect={showSelect }
      />
    </li>
  );
};

export function LanguageTree({ root }: { root: ILanguage }) {
  const { isPending, error, data: descendants } = getDescendants(root.id);
  
  if(isPending || error) {
    return (
      <>
        <h3>Descendants</h3>
        <p>{ isPending ? "Loading..." : error.message }</p>
      </>
    );
  } else if(descendants.length === 0) {
    return null;
  } else {
    return (
      <>
        <h3>Descendants</h3>
        <ul className="language-tree-root">
          <LanguageTreeBranch
            root={root}
            descendants={descendants}
            showSelect={false}
          />
        </ul>
      </>
    );
  }
};

export function FamilyTree({ id, showSelect }: { id: string, showSelect: boolean }) {
  const { isPending, error, data: descendants } = getFamilyMembers(id);
  
  if(isPending) {
    return "Loading...";
  } else if(error) {
    return error.message;
  } else if(descendants.length === 0) {
    return "None.";
  } else {
    const root = descendants.find(language => language.parentId === null);
    return root && (
      <ul className="language-tree-root">
        <LanguageTreeBranch
          root={root}
          descendants={descendants}
          showSelect={showSelect}
        />
      </ul>
    );
  }
};
