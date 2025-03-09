import { useReducer, useState } from 'react';
import { Link } from 'react-router-dom';

import SaveChangesButton from '../components/SaveChangesButton.tsx';

import {
  getLanguageById, getWordClassesByLanguage, ILanguage
} from '../languageData.tsx';
import {
  useSetPageTitle, sendBackendJson, useUnsavedPopup, useGetParamsOrSelectedId
} from '../utils.tsx';
import { getPartsOfSpeech, IPartOfSpeech, IWordClass } from '../wordData.tsx';

const UNADDED_CLASS_ID = "";

async function sendSaveClassesRequest(state: IClassesReducerState, langId: string) {
  const newClasses = state.classes.filter(
    cls => !state.deleted.includes(cls.id)
  );
  const reqBody = {
    new: newClasses.map(cls => ({
      ...cls, id: cls.id !== UNADDED_CLASS_ID ? cls.id : null
    })),
    deleted: state.deleted
  };
  const res = await sendBackendJson(`languages/${langId}/word-classes`, 'PUT', reqBody);
  if(!res.ok) {
    throw res.body;
  }
  return res.body;
}

function compareClasses(c1: IWordClass, c2: IWordClass) {
  if(c1.pos !== c2.pos) {
    return c1.pos.localeCompare(c2.pos);
  } else {
    return c1.code.localeCompare(c2.code);
  }
}

interface IClassesReducerState {
  classes: IWordClass[];
  deleted: string[];
  saved: boolean;
}

type IClassesReducerAction = {
  type: 'add';
  newClass: IWordClass;
} | {
  type: 'edit';
  class: IWordClass;
  newPos?: string;
  newCode?: string;
  newName?: string;
} | {
  type: 'delete';
  class: IWordClass;
} | {
  type: 'restore';
  class: IWordClass;
} | {
  type: 'markSaved';
  newClasses: IWordClass[];
};

function classesReducer(state: IClassesReducerState, action: IClassesReducerAction) {
  const { classes, deleted } = state;

  switch(action.type) {
    case 'add':
      const newClasses = [ ...classes, action.newClass ];
      newClasses.sort(compareClasses);
      return {
        classes: newClasses,
        deleted,
        saved: false
      };
    
    case 'edit':
      const index = classes.indexOf(action.class);
      if(index < 0) {
        return state;
      }
      const newClass: IWordClass = {
        id: action.class.id,
        pos: action.newPos ?? action.class.pos,
        code: action.newCode ?? action.class.code,
        name: action.newName ?? action.class.name
      };
      return {
        classes: [
          ...classes.slice(0, index),
          newClass,
          ...classes.slice(index + 1)
        ],
        deleted,
        saved: false
      };
    
    case 'delete':
      if(action.class.id === UNADDED_CLASS_ID) {
        return {
          classes: classes.filter(cls => cls !== action.class),
          deleted,
          saved: false
        };
      } else {
        return {
          classes,
          deleted: [ ...deleted, action.class.id ],
          saved: false
        };
      }
    
    case 'restore':
      return {
        classes,
        deleted: deleted.filter(id => id !== action.class.id),
        saved: false
      };
    
    case 'markSaved':
      return {
        classes: action.newClasses,
        deleted: [],
        saved: true
      };
    
    default:
      throw new Error("Unknown action type: " + (action as any).type);
  }
}

interface IEditWordClasses {
  language: ILanguage;
  initialClasses: IWordClass[];
  partsOfSpeech: IPartOfSpeech[];
}

function EditWordClasses({ language, initialClasses, partsOfSpeech }: IEditWordClasses) {
  const [ newClassPos, setNewClassPos ] = useState("");
  const [ newClassCode, setNewClassCode ] = useState("");
  const [ newClassName, setNewClassName ] = useState("");
  const [ classErrorMessage, setClassErrorMessage ] = useState("");

  const [ classesState, dispatchClasses ] = useReducer(classesReducer, {
    classes: initialClasses.slice().sort(compareClasses), deleted: [], saved: true
  });
  const { classes, deleted: deletedClasses, saved: classesAreSaved } = classesState;

  const [ isSaving, setIsSaving ] = useState(false);

  useUnsavedPopup(!classesAreSaved);
  
  function addNewClass() {
    const pos = newClassPos;
    const code = newClassCode;
    const name = newClassName;
    if(!pos) {
      setClassErrorMessage("Please choose a part of speech.");
    } else {
      dispatchClasses({
        type: 'add',
        newClass: { id: UNADDED_CLASS_ID, pos, code, name }
      });
      setNewClassCode("");
      setNewClassName("");
      setClassErrorMessage("");
    }
  }
  
  function deleteClass(cls: IWordClass) {
    dispatchClasses({
      type: 'delete',
      class: cls
    });
  }
  
  function restoreClass(cls: IWordClass) {
    dispatchClasses({
      type: 'restore',
      class: cls
    });
  }
  
  function editClassCode(cls: IWordClass, newCode: string) {
    dispatchClasses({
      type: 'edit',
      class: cls,
      newCode
    });
  }
  
  function editClassName(cls: IWordClass, newName: string) {
    dispatchClasses({
      type: 'edit',
      class: cls,
      newName
    });
  }
  
  function editClassPos(cls: IWordClass, newPos: string) {
    dispatchClasses({
      type: 'edit',
      class: cls,
      newPos
    });
  }
  
  return (
    <>
      <h3>Word Classes</h3>
      <p>Edit word classes.</p>
      {
        classErrorMessage && <p><b>{classErrorMessage}</b></p>
      }
      {
        !classesAreSaved && <>
          <SaveChangesButton<IWordClass[]>
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            saveQueryKey={ ['languages', language.id, 'word-classes', 'update'] }
            saveQueryFn={ async () => await sendSaveClassesRequest(classesState, language.id) }
            handleSave={ data => dispatchClasses({ type: 'markSaved', newClasses: data }) }
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
            <th><abbr title="part of speech">POS</abbr></th>
            <th></th>
          </tr>
          <tr>
            <td>
              <input
                type="text"
                value={newClassCode}
                onChange={ e => setNewClassCode(e.target.value) }
                style={{ width: "3em" }}
              />
            </td>
            <td>
              <input
                type="text"
                value={newClassName}
                onChange={ e => setNewClassName(e.target.value) }
              />
            </td>
            <td>
              <select
                value={newClassPos}
                onChange={ e => setNewClassPos(e.target.value) }
              >
                <option value="">---</option>
                {
                  partsOfSpeech.map(
                    pos => <option value={ pos.code } key={ pos.code }>{ pos.name }</option>
                  )
                }
              </select>
            </td>
            <td>
              <span className="hover-light-grey" onClick={ () => addNewClass() }>
                <span className="letter-button letter-button-small letter-button-t"></span>
              </span>
            </td>
          </tr>
          {
            classes.map((cls, i) => {
              const isDeleted = deletedClasses.includes(cls.id);
              return (
                <tr key={i} className={ isDeleted ? "deleted-pos-row" : undefined }>
                  <td>
                    <input
                      type="text"
                      value={cls.code}
                      onChange={ e => editClassCode(cls, e.target.value) }
                      style={{ width: "3em" }}
                      disabled={isDeleted}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={cls.name}
                      onChange={ e => editClassName(cls, e.target.value) }
                      disabled={isDeleted}
                    />
                  </td>
                  <td>
                    {
                      cls.id === UNADDED_CLASS_ID
                      ? <select
                          value={cls.pos}
                          onChange={ e => editClassPos(cls, e.target.value) }
                        >
                          <option value="">---</option>
                          {
                            partsOfSpeech.map(
                              pos => <option value={ pos.code } key={ pos.code }>{ pos.name }</option>
                            )
                          }
                        </select>
                      : partsOfSpeech.find(p => p.code === cls.pos)?.name
                    }
                  </td>
                  <td>
                    {
                      isDeleted
                      ? <span onClick={ () => restoreClass(cls) } className="hover-light-grey">
                          <span className="letter-button letter-button-small letter-button-refresh"></span>
                        </span>
                      : <span onClick={ () => deleteClass(cls) } className="hover-light-grey">
                          <span className="letter-button letter-button-small letter-button-x"></span>
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
        !classesAreSaved && <>
          <br />
          <SaveChangesButton<IWordClass[]>
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            saveQueryKey={ ['languages', language.id, 'word-classes', 'update'] }
            saveQueryFn={ async () => await sendSaveClassesRequest(classesState, language.id) }
            handleSave={ data => dispatchClasses({ type: 'markSaved', newClasses: data }) }
            style={{ marginTop: "0.8em" }}
          >
            Save changes
          </SaveChangesButton>
        </>
      }
    </>
  );
};

interface IEditDictionarySettingsInner {
  language: ILanguage;
  classes: IWordClass[];
  partsOfSpeech: IPartOfSpeech[];
}

function EditDictionarySettingsInner({ language, classes, partsOfSpeech }: IEditDictionarySettingsInner) {
  return (
    <>
      <h2>Edit Dictionary Settings</h2>
      <p>Configure <Link to={ '/language/' + language.id }>{ language.name }</Link>'s dictionary settings.</p>
      <EditWordClasses
        language={language}
        initialClasses={classes}
        partsOfSpeech={partsOfSpeech}
      />
    </>
  )
}

export default function EditDictionarySettings() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }
  
  const languageResponse = getLanguageById(languageId);
  const classesResponse = getWordClassesByLanguage(languageId);
  const partsOfSpeechResponse = getPartsOfSpeech();
  
  useSetPageTitle("Edit Dictionary Settings");

  if(languageResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(languageResponse.status === 'error') {
    return (
      <>
        <h2>{ languageResponse.error.title }</h2>
        <p>{ languageResponse.error.message }</p>
      </>
    );
  }

  if(classesResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(classesResponse.status === 'error') {
    return (
      <p>{ classesResponse.error.message }</p>
    );
  }

  if(partsOfSpeechResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(partsOfSpeechResponse.status === 'error') {
    return (
      <p>{ partsOfSpeechResponse.error.message }</p>
    );
  }

  return (
    <EditDictionarySettingsInner
      language={ languageResponse.data }
      classes={ classesResponse.data }
      partsOfSpeech={ partsOfSpeechResponse.data }
    />
  );
};
