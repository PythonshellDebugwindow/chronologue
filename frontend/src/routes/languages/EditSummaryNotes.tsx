import { useState } from 'react';
import { Link } from 'react-router-dom';

import SaveChangesButton from '@/components/SaveChangesButton';

import { useLanguage, useLanguageSummaryNotes } from '@/hooks/languages';

import { ILanguage, ILanguageSummaryNotes } from '@/types/languages';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

import styles from './EditSummaryNotes.module.css';

async function sendSaveNotesRequest(notes: ILanguageSummaryNotes, langId: string) {
  const reqBody = {
    description: notes.description,
    phonologyNotes: notes.phonologyNotes,
    orthographyNotes: notes.orthographyNotes
  };
  const res = await sendBackendJson(`languages/${langId}/summary-notes`, 'PUT', reqBody);
  if(!res.ok) {
    throw res.body;
  }
  return res.body;
}

interface IEditSummaryNotesInner {
  language: ILanguage;
  summaryNotes: ILanguageSummaryNotes;
}

function EditSummaryNotesInner({ language, summaryNotes }: IEditSummaryNotesInner) {
  const [description, setDescription] = useState(summaryNotes.description);
  const [phonologyNotes, setPhonologyNotes] = useState(summaryNotes.phonologyNotes);
  const [orthographyNotes, setOrthographyNotes] = useState(summaryNotes.orthographyNotes);

  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  async function saveQueryFn() {
    const data = { description, phonologyNotes, orthographyNotes };
    return await sendSaveNotesRequest(data, language.id);
  }

  return (
    <>
      <h2>Edit Summary Notes</h2>
      <p>
        Editing <Link to={'/language/' + language.id}>{language.name}</Link>'s summary notes.
      </p>
      {!isSaved && (
        <SaveChangesButton
          isSaving={isSavingNotes}
          setIsSaving={setIsSavingNotes}
          saveQueryKey={['languages', language.id, 'summary-notes', 'update']}
          saveQueryFn={saveQueryFn}
          handleSave={() => setIsSaved(true)}
        >
          Save changes
        </SaveChangesButton>
      )}
      <label className={styles.wideTextareaLabel}>
        <p>Description</p>
        <textarea
          value={description}
          onChange={e => {
            setDescription(e.target.value);
            setIsSaved(false);
          }}
        />
      </label>
      <label className={styles.wideTextareaLabel}>
        <p>Phonology notes</p>
        <textarea
          value={phonologyNotes}
          onChange={e => {
            setPhonologyNotes(e.target.value);
            setIsSaved(false);
          }}
        />
      </label>
      <label className={styles.wideTextareaLabel}>
        <p>Orthography notes</p>
        <textarea
          value={orthographyNotes}
          onChange={e => {
            setOrthographyNotes(e.target.value);
            setIsSaved(false);
          }}
        />
      </label>
      {!isSaved && (
        <SaveChangesButton
          isSaving={isSavingNotes}
          setIsSaving={setIsSavingNotes}
          saveQueryKey={['languages', language.id, 'summary-notes', 'update']}
          saveQueryFn={saveQueryFn}
          handleSave={() => setIsSaved(true)}
          style={{ marginTop: "0.8em" }}
        >
          Save changes
        </SaveChangesButton>
      )}
    </>
  );
}

export default function EditSummaryNotes() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);
  const summaryNotesResponse = useLanguageSummaryNotes(languageId);

  useSetPageTitle("Edit Summary Notes");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(summaryNotesResponse.status !== 'success') {
    return renderDatalessQueryResult(summaryNotesResponse);
  }

  return (
    <EditSummaryNotesInner
      language={languageResponse.data}
      summaryNotes={summaryNotesResponse.data}
    />
  );
}
