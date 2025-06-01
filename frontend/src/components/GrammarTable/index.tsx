import { PropsWithChildren, ReactNode } from 'react';

import styles from './GrammarTable.module.css';

interface IGrammarTable {
  padded?: boolean;
  children: ReactNode;
}

export function GrammarTable({ padded = false, children }: IGrammarTable) {
  const paddedClass = padded ? " " + styles.padded : "";
  return (
    <table className={styles.grammarTable + paddedClass}>
      <tbody>
        {children}
      </tbody>
    </table>
  );
}

export function EmptyGrammarTableCell() {
  return <td className={styles.emptyCell}>&nbsp;</td>;
}

export function GrammarTableLinks({ children }: PropsWithChildren) {
  return (
    <small className={styles.grammarTableLinks}>
      {children}
    </small>
  );
}
