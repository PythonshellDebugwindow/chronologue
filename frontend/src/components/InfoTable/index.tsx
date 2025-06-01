import { PropsWithChildren } from 'react';

import styles from './InfoTable.module.css';

export default function InfoTable({ children }: PropsWithChildren) {
  return (
    <table className={styles.infoTable}>
      <tbody>
        {children}
      </tbody>
    </table>
  );
}
