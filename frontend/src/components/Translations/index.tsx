import { PropsWithChildren, ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';

import DisplayDate from '../DisplayDate';
import DropdownToggle from '../DropdownToggle';

import { IGrammarForm } from '@/types/grammar';
import { ILanguageTranslation } from '@/types/translations';

import { formatTextWithGrammarForms } from '@/utils/grammar';

import styles from './Translations.module.css';

interface ITranslationInfo {
  small?: boolean;
  children: ReactNode;
}

export function TranslationInfo({ small = false, children }: ITranslationInfo) {
  const smallClass = small ? " " + styles.small : "";
  return (
    <div className={styles.translationInfo + smallClass}>
      {children}
    </div>
  );
}

export function LanguageTranslationsTable({ children }: PropsWithChildren) {
  return (
    <table className={styles.translationsTable + " " + styles.equal}>
      <tbody>
        {children}
      </tbody>
    </table>
  );
}

export function TranslationLanguagesTable({ children }: PropsWithChildren) {
  return (
    <table className={styles.translationsTable}>
      <tbody>
        {children}
      </tbody>
    </table>
  );
}

interface ITranslationRow {
  workInProgress?: boolean;
  children: ReactNode;
}

export function TranslationRow({ workInProgress = false, children }: ITranslationRow) {
  return (
    <tr className={workInProgress ? styles.wip : undefined}>
      {children}
    </tr>
  );
}

export function TranslationWIPText() {
  return <span className={styles.wipText}>Work In Progress</span>;
}

export function TranslationContent({ children }: PropsWithChildren) {
  return (
    <p className={styles.content}>
      {children}
    </p>
  );
}

interface ITranslationDropdowns {
  languageTranslation: ILanguageTranslation;
  grammarForms: IGrammarForm[];
}

export function TranslationDropdowns({ languageTranslation, grammarForms }: ITranslationDropdowns) {
  const [showingIpa, setShowingIpa] = useState(false);
  const [showingNotes, setShowingNotes] = useState(false);
  const [showingGloss, setShowingGloss] = useState(false);

  return (
    <>
      <div className={styles.dropdowns}>
        {languageTranslation.ipa && (
          <DropdownToggle
            label="IPA"
            open={showingIpa}
            setOpen={setShowingIpa}
          />
        )}
        {languageTranslation.gloss && (
          <DropdownToggle
            label="Gloss"
            open={showingGloss}
            setOpen={setShowingGloss}
          />
        )}
        {languageTranslation.notes && (
          <DropdownToggle
            label="Notes"
            open={showingNotes}
            setOpen={setShowingNotes}
          />
        )}
      </div>
      {showingIpa && (
        <p className={styles.contentSmall}>{languageTranslation.ipa}</p>
      )}
      {showingGloss && (
        <p className={styles.contentSmall}>
          {formatTextWithGrammarForms(languageTranslation.gloss, grammarForms)}
        </p>
      )}
      {showingNotes && (
        <p className={styles.contentSmall}>{languageTranslation.notes}</p>
      )}
    </>
  );
}

interface ILanguageTranslationDateAndLinks {
  created: Date;
  translationId: string;
  languageId: string;
}

export function LanguageTranslationDateAndLinks(
  { created, translationId, languageId }: ILanguageTranslationDateAndLinks
) {
  return (
    <p className={styles.dateAndLinks}>
      Added on <DisplayDate date={created} />
      <span style={{ float: "right" }}>
        <Link to={`/translation/${translationId}?lang=${languageId}`}>
          [link]
        </Link>
        {" "}
        <Link to={`/translate-text/${translationId}?lang=${languageId}`}>
          [edit]
        </Link>
        {" "}
        <Link to={`/delete-text-translation/${translationId}?lang=${languageId}`}>
          [delete]
        </Link>
      </span>
    </p>
  );
}

export function TranslationDateAndLinks({ translationId }: { translationId: string }) {
  return (
    <p className={styles.dateAndLinks}>
      <Link to={`/translation/${translationId}`}>
        View translation
      </Link>
      <span style={{ float: "right" }}>
        <Link to={`/edit-translation/${translationId}`}>
          [edit]
        </Link>
        {" "}
        <Link to={`/delete-translation/${translationId}`}>
          [delete]
        </Link>
      </span>
    </p>
  );
}
