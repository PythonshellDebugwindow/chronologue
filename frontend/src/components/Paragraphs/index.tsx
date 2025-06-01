import { PropsWithChildren, ReactNode } from 'react';

import styles from './Paragraphs.module.css';

export function InfoParagraph({ children }: PropsWithChildren) {
  return <p className={styles.infoParagraph}>{children}</p>;
}

interface IUserNotesParagraph {
  marginTop?: string;
  children: ReactNode;
}

export function UserNotesParagraph({ marginTop, children }: IUserNotesParagraph) {
  const style = marginTop ? { marginTop } : undefined;
  return <p className={styles.userNotesParagraph} style={style}>{children}</p>;
}
