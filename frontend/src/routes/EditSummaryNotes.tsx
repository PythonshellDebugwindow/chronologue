import { useState } from 'react';
import { Link } from 'react-router-dom';

import SaveChangesButton from '../components/SaveChangesButton.tsx';

import {
  useLanguage, useLanguageSummaryNotes, ILanguage, ILanguageSummaryNotes
} from '../languageData.tsx';
import {
  renderDatalessQueryResult, sendBackendJson, useGetParamsOrSelectedId,
  useSetPageTitle
} from '../utils.tsx';

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
  const [ description, setDescription ] = useState(summaryNotes.description);
  const [ phonologyNotes, setPhonologyNotes ] = useState(summaryNotes.phonologyNotes);
  const [ orthographyNotes, setOrthographyNotes ] = useState(summaryNotes.orthographyNotes);

  const [ isSavingNotes, setIsSavingNotes ] = useState(false);
  const [ isSaved, setIsSaved ] = useState(true);

  async function saveQueryFn() {
    const data = { description, phonologyNotes, orthographyNotes };
    return await sendSaveNotesRequest(data, language.id);
  }

  return (
    <>
      <h2>Edit Summary Notes</h2>
      <p>Editing <Link to={ '/language/' + language.id }>{ language.name }</Link>'s summary notes.</p>
      {
        !isSaved && (
          <SaveChangesButton<ILanguageSummaryNotes>
            isSaving={isSavingNotes}
            setIsSaving={setIsSavingNotes}
            saveQueryKey={ ['languages', language.id, 'summary-notes', 'update'] }
            saveQueryFn={saveQueryFn}
            handleSave={ () => setIsSaved(true) }
          >
            Save changes
          </SaveChangesButton>
        )
      }
      <label className="wide-textarea-label">
        <p>Description</p>
        <textarea
          className="wide-textarea"
          value={description}
          onChange={ e => { setDescription(e.target.value); setIsSaved(false); } }
        />
      </label>
      <label className="wide-textarea-label">
        <p>Phonology notes</p>
        <textarea
          className="wide-textarea"
          value={phonologyNotes}
          onChange={ e => { setPhonologyNotes(e.target.value); setIsSaved(false); } }
        />
      </label>
      <label className="wide-textarea-label">
        <p>Orthography notes</p>
        <textarea
          className="wide-textarea"
          value={orthographyNotes}
          onChange={ e => { setOrthographyNotes(e.target.value); setIsSaved(false); } }
        />
      </label>
      {
        !isSaved && (
          <SaveChangesButton<ILanguageSummaryNotes>
            isSaving={isSavingNotes}
            setIsSaving={setIsSavingNotes}
            saveQueryKey={ ['languages', language.id, 'summary-notes', 'update'] }
            saveQueryFn={saveQueryFn}
            handleSave={ () => setIsSaved(true) }
            style={{ marginTop: "0.8em" }}
          >
            Save changes
          </SaveChangesButton>
        )
      }
    </>
  )
};

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
      language={ languageResponse.data }
      summaryNotes={ summaryNotesResponse.data }
    />
  );
};
