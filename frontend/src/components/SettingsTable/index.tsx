import { ReactNode } from 'react';

import styles from './SettingsTable.module.css';

interface ISettingsTable {
  alignTop?: boolean;
  children: ReactNode;
}

export function SettingsTable({ alignTop = false, children }: ISettingsTable) {
  const alignTopClass = alignTop ? " " + styles.alignTop : "";
  return (
    <table className={styles.settingsTable + alignTopClass}>
      <tbody>
        {children}
      </tbody>
    </table>
  );
}

interface ISettingsTableRow {
  deleted?: boolean;
  children: ReactNode;
}

export function SettingsTableRow({ deleted = false, children }: ISettingsTableRow) {
  return (
    <tr className={deleted ? styles.deletedRow : undefined}>
      {children}
    </tr>
  );
}
