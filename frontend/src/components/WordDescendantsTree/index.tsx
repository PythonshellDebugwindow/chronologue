import { Link } from 'react-router-dom';

import { useWordDescendants } from '@/hooks/words';

import { ILanguage } from '@/types/languages';
import { IWord, IWordDescendantOverview } from '@/types/words';

import styles from './WordDescendantsTree.module.css';

type TreeBranchRoot = Omit<IWordDescendantOverview, 'parentId'>;

function makeWordDescendantsTreeBranch(
  root: TreeBranchRoot, descendants: IWordDescendantOverview[], seen: IWordDescendantOverview[]
) {
  const directChildren = descendants.filter(word => (
    word.parentId === root.id && !seen.includes(word)
  ));
  for(const word of directChildren) {
    seen.push(word);
  }
  const childBranches = directChildren.map(word => (
    makeWordDescendantsTreeBranch(word, descendants, seen)
  ));
  const childBranchesJsx = directChildren.length > 0 ? <ul>{childBranches}</ul> : null;
  return (
    <li key={root.id}>
      {root.isBorrowed && (
        <>
          <span title="borrowed" style={{ cursor: "help" }}>
            →
          </span>
          {" "}
        </>
      )}
      {root.langName + ": "}
      <Link to={'/word/' + root.id}>
        {root.langStatus === 'proto' && "*"}
        {root.word}
      </Link>
      {childBranchesJsx}
    </li>
  );
}

export default function WordDescendantsTree({ root, language }: { root: IWord, language: ILanguage }) {
  const { isPending, error, data: descendants } = useWordDescendants(root.id);

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
    const rootWithLanguageData = {
      ...root,
      langName: language.name,
      langStatus: language.status,
      isBorrowed: false
    };
    return (
      <>
        <h3>Descendants</h3>
        <ul className={styles.wordDescendantsTreeRoot}>
          {makeWordDescendantsTreeBranch(rootWithLanguageData, descendants, [])}
        </ul>
      </>
    );
  }
}
