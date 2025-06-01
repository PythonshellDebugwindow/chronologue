import { useContext } from 'react';
import { Link } from 'react-router-dom';

import SelectedLanguageContext from '@/contexts/SelectedLanguageContext'

import { useFamilyMembers } from '@/hooks/families';
import { useLanguageDescendants } from '@/hooks/languages';

import { ILanguage } from '@/types/languages';

import styles from './LanguageTree.module.css';

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
      <Link to={'/language/' + root.id}>
        {root.name}
      </Link>
      {showSelect && root.id !== selectedLanguage?.id && (
        <>
          {" "}
          <span style={{ fontSize: "small" }}>
            [
            <Link
              to={'/language/' + root.id}
              onClick={() => setSelectedLanguage(root)}
            >
              select
            </Link>
            ]
          </span>
        </>
      )}
      <AllChildBranches
        root={root}
        descendants={descendants}
        showSelect={showSelect}
      />
    </li>
  );
}

export function LanguageTree({ root }: { root: ILanguage }) {
  const { isPending, error, data: descendants } = useLanguageDescendants(root.id);

  if(isPending || error) {
    return (
      <>
        <h3>Descendants</h3>
        <p>{isPending ? "Loading..." : error.message}</p>
      </>
    );
  } else if(descendants.length === 0) {
    return null;
  } else {
    return (
      <>
        <h3>Descendants</h3>
        <ul className={styles.languageTreeRoot}>
          <LanguageTreeBranch
            root={root}
            descendants={descendants}
            showSelect={false}
          />
        </ul>
      </>
    );
  }
}

export function FamilyTree({ id, showSelect }: { id: string, showSelect: boolean }) {
  const { isPending, error, data: descendants } = useFamilyMembers(id);

  if(isPending) {
    return "Loading...";
  } else if(error) {
    return error.message;
  } else if(descendants.length === 0) {
    return "None.";
  } else {
    const root = descendants.find(language => language.parentId === null);
    return root && (
      <ul className={styles.languageTreeRoot}>
        <LanguageTreeBranch
          root={root}
          descendants={descendants}
          showSelect={showSelect}
        />
      </ul>
    );
  }
}

export function IsolateList({ languages }: { languages: ILanguage[] }) {
  return (
    <ul className={styles.languageTreeRoot}>
      {languages.map(lang => (
        <li key={lang.id}>
          <Link to={'/language/' + lang.id}>
            {lang.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
