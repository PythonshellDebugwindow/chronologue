import { useReducer, useState } from 'react';

import SaveChangesButton from '../components/SaveChangesButton.tsx';

import { IGrammarForm, getGrammarForms } from '../grammarData.tsx';
import {
  renderDatalessQueryResult, sendBackendJson, useSetPageTitle, useUnsavedPopup
} from '../utils.tsx';

const UNADDED_FORM_ID = "";

async function sendSaveFormsRequest(state: IFormsReducerState) {
  const newForms = state.forms.filter(form => !state.deleted.includes(form.id));
  const reqBody = {
    new: newForms.map(form => ({
      ...form, id: form.id !== UNADDED_FORM_ID ? form.id : null
    })),
    deleted: state.deleted
  };
  const res = await sendBackendJson('grammar-forms', 'PUT', reqBody);
  if(!res.ok) {
    throw res.body;
  }
  return res.body;
}

function compareGrammarForms(f1: IGrammarForm, f2: IGrammarForm) {
  return f1.code.localeCompare(f2.code);
}

interface IFormsReducerState {
  forms: IGrammarForm[];
  deleted: string[];
  saved: boolean;
}

type IFormsReducerAction = {
  type: 'add';
  newForm: IGrammarForm;
} | {
  type: 'edit';
  form: IGrammarForm;
  newCode?: string;
  newName?: string;
} | {
  type: 'delete';
  form: IGrammarForm;
} | {
  type: 'restore';
  form: IGrammarForm;
} | {
  type: 'markSaved';
  newForms: IGrammarForm[];
};

function formsReducer(state: IFormsReducerState, action: IFormsReducerAction) {
  const { forms, deleted } = state;

  switch(action.type) {
    case 'add':
      const newForms = [ ...forms, action.newForm ];
      newForms.sort(compareGrammarForms);
      return {
        forms: newForms,
        deleted,
        saved: false
      };
    
    case 'edit':
      const index = forms.indexOf(action.form);
      if(index < 0) {
        return state;
      }
      const newForm: IGrammarForm = {
        id: action.form.id,
        code: action.newCode ?? action.form.code,
        name: action.newName ?? action.form.name
      };
      return {
        forms: [
          ...forms.slice(0, index),
          newForm,
          ...forms.slice(index + 1)
        ],
        deleted,
        saved: false
      };
    
    case 'delete':
      if(action.form.id === UNADDED_FORM_ID) {
        return {
          forms: forms.filter(form => form !== action.form),
          deleted,
          saved: false
        };
      } else {
        return {
          forms,
          deleted: [ ...deleted, action.form.id ],
          saved: false
        };
      }
    
    case 'restore':
      return {
        forms,
        deleted: deleted.filter(id => id !== action.form.id),
        saved: false
      };
    
    case 'markSaved':
      return {
        forms: action.newForms,
        deleted: [],
        saved: true
      };
    
    default:
      throw new Error("Unknown action type: " + (action as any).type);
  }
}

function EditDictionarySettingsInner({ initialForms }: { initialForms: IGrammarForm[] }) {
  const [ newFormCode, setNewFormCode ] = useState("");
  const [ newFormName, setNewFormName ] = useState("");
  const [ formErrorMessage, setFormErrorMessage ] = useState("");

  const [ formsState, dispatchForms ] = useReducer(formsReducer, {
    forms: initialForms.slice().sort(compareGrammarForms), deleted: [], saved: true
  });
  const { forms: grammarForms, deleted: deletedForms, saved: formsAreSaved } = formsState;

  const [ isSaving, setIsSaving ] = useState(false);

  useUnsavedPopup(!formsAreSaved);
  
  function addNewForm() {
    if(!newFormCode) {
      setFormErrorMessage("Please choose a code.");
    } else if(!newFormName) {
      setFormErrorMessage("Please choose a name.");
    } else {
      dispatchForms({
        type: 'add',
        newForm: { id: UNADDED_FORM_ID, code: newFormCode, name: newFormName }
      });
      setNewFormCode("");
      setNewFormName("");
      setFormErrorMessage("");
    }
  }
  
  function deleteForm(form: IGrammarForm) {
    dispatchForms({
      type: 'delete',
      form
    });
  }
  
  function restoreForm(form: IGrammarForm) {
    dispatchForms({
      type: 'restore',
      form
    });
  }
  
  function editFormCode(form: IGrammarForm, newCode: string) {
    dispatchForms({
      type: 'edit',
      form,
      newCode
    });
  }
  
  function editFormName(form: IGrammarForm, newName: string) {
    dispatchForms({
      type: 'edit',
      form,
      newName
    });
  }
  
  return (
    <>
      <h2>Edit Grammar Forms</h2>
      <p>Edit the list of available grammar forms for all languages.</p>
      <p>
        For some common codes, see{" "}
        <a href="https://en.wikipedia.org/wiki/List_of_glossing_abbreviations">this list</a>.
      </p>
      { formErrorMessage && <p><b>{formErrorMessage}</b></p> }
      {
        !formsAreSaved && <>
          <SaveChangesButton<IGrammarForm[]>
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            saveQueryKey={ ['grammar-forms', 'update'] }
            saveQueryFn={ async () => await sendSaveFormsRequest(formsState) }
            handleSave={ data => dispatchForms({ type: 'markSaved', newForms: data }) }
            style={{ marginBottom: "0.8em" }}
          >
            Save changes
          </SaveChangesButton>
        </>
      }
      <table className="settings-table">
        <tbody>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>&nbsp;</th>
          </tr>
          <tr>
            <td>
              <input
                type="text"
                value={newFormCode}
                onChange={ e => setNewFormCode(e.target.value.toUpperCase()) }
                style={{ width: "3em" }}
              />
            </td>
            <td>
              <input
                type="text"
                value={newFormName}
                onChange={ e => setNewFormName(e.target.value) }
              />
            </td>
            <td>
              <span className="hover-light-grey" onClick={ () => addNewForm() }>
                <span className="letter-button letter-button-small letter-button-t" />
              </span>
            </td>
          </tr>
          {
            grammarForms.map((form, i) => {
              const isDeleted = form.id !== UNADDED_FORM_ID && deletedForms.includes(form.id);
              return (
                <tr key={i} className={ isDeleted ? "deleted-pos-row" : undefined }>
                  <td>
                    <input
                      type="text"
                      value={form.code}
                      onChange={ e => editFormCode(form, e.target.value.toUpperCase()) }
                      style={{ width: "3em" }}
                      disabled={isDeleted}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={form.name}
                      onChange={ e => editFormName(form, e.target.value) }
                      disabled={isDeleted}
                    />
                  </td>
                  <td>
                    {
                      isDeleted
                      ? <span onClick={ () => restoreForm(form) } className="hover-light-grey">
                          <span className="letter-button letter-button-small letter-button-refresh" />
                        </span>
                      : <span onClick={ () => deleteForm(form) } className="hover-light-grey">
                          <span className="letter-button letter-button-small letter-button-x" />
                        </span>
                    }
                  </td>
                </tr>
              );
            })
          }
        </tbody>
      </table>
      {
        !formsAreSaved && <>
          <br />
          <SaveChangesButton<IGrammarForm[]>
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            saveQueryKey={ ['grammar-forms', 'update'] }
            saveQueryFn={ async () => await sendSaveFormsRequest(formsState) }
            handleSave={ data => dispatchForms({ type: 'markSaved', newForms: data }) }
            style={{ marginTop: "0.8em" }}
          >
            Save changes
          </SaveChangesButton>
        </>
      }
    </>
  );
};

export default function EditGrammarForms() {
  const grammarFormsResponse = getGrammarForms();
  
  useSetPageTitle("Edit Grammar Forms");

  if(grammarFormsResponse.status !== 'success') {
    return renderDatalessQueryResult(grammarFormsResponse);
  }

  return (
    <EditDictionarySettingsInner
      initialForms={ grammarFormsResponse.data }
    />
  );
};
