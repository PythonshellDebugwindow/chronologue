import { useReducer, useState } from 'react';
import { Link } from 'react-router-dom';

import SaveChangesButton from '../components/SaveChangesButton.tsx';

import {
  useLanguage,
  useLanguageDictionarySettings,
  useLanguageWordClasses
} from '@/hooks/languages';
import { usePartsOfSpeech } from '@/hooks/words';

import { IDictionarySettings, ILanguage } from '@/types/languages';
import { IPartOfSpeech, IWordClass } from '@/types/words';

import {
  useGetParamsOrSelectedId,
  useSetPageTitle,
  useUnsavedPopup
} from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

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
    case 'add': {
      const newClasses = [...classes, action.newClass];
      newClasses.sort(compareClasses);
      return {
        classes: newClasses,
        deleted,
        saved: false
      };
    }

    case 'edit': {
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
    }

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
          deleted: [...deleted, action.class.id],
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

async function sendSaveDictSettingsRequest(settings: IDictionarySettings, langId: string) {
  const res = await sendBackendJson(`languages/${langId}/dictionary-settings`, 'PUT', settings);
  if(!res.ok) {
    throw res.body;
  }
  return res.body;
}

interface IEditWordClasses {
  language: ILanguage;
  initialClasses: IWordClass[];
  partsOfSpeech: IPartOfSpeech[];
}

function EditWordClasses({ language, initialClasses, partsOfSpeech }: IEditWordClasses) {
  const [newClassPos, setNewClassPos] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [classErrorMessage, setClassErrorMessage] = useState("");

  const [classesState, dispatchClasses] = useReducer(classesReducer, {
    classes: initialClasses.slice().sort(compareClasses), deleted: [], saved: true
  });
  const { classes, deleted: deletedClasses, saved: classesAreSaved } = classesState;

  const [isSaving, setIsSaving] = useState(false);

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
      {classErrorMessage && <p><b>{classErrorMessage}</b></p>}
      {!classesAreSaved && (
        <SaveChangesButton
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          saveQueryKey={['languages', language.id, 'word-classes', 'update']}
          saveQueryFn={async () => await sendSaveClassesRequest(classesState, language.id)}
          handleSave={data => dispatchClasses({ type: 'markSaved', newClasses: data })}
          style={{ marginBottom: "0.8em" }}
        >
          Save changes
        </SaveChangesButton>
      )}
      <table className="settings-table">
        <tbody>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th><abbr title="part of speech">POS</abbr></th>
            <th>&nbsp;</th>
          </tr>
          <tr>
            <td>
              <input
                type="text"
                value={newClassCode}
                onChange={e => setNewClassCode(e.target.value)}
                style={{ width: "3em" }}
              />
            </td>
            <td>
              <input
                type="text"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
              />
            </td>
            <td>
              <select
                value={newClassPos}
                onChange={e => setNewClassPos(e.target.value)}
              >
                <option value="">---</option>
                {partsOfSpeech.map(
                  pos => <option value={pos.code} key={pos.code}>{pos.name}</option>
                )}
              </select>
            </td>
            <td>
              <span className="hover-light-grey" onClick={() => addNewClass()}>
                <span className="letter-button letter-button-small letter-button-t" />
              </span>
            </td>
          </tr>
          {classes.map((cls, i) => {
            const isDeleted = deletedClasses.includes(cls.id);
            return (
              <tr key={i} className={isDeleted ? "deleted-row" : undefined}>
                <td>
                  <input
                    type="text"
                    value={cls.code}
                    onChange={e => editClassCode(cls, e.target.value)}
                    style={{ width: "3em" }}
                    disabled={isDeleted}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={cls.name}
                    onChange={e => editClassName(cls, e.target.value)}
                    disabled={isDeleted}
                  />
                </td>
                <td>
                  {
                    cls.id === UNADDED_CLASS_ID
                      ? <select
                          value={cls.pos}
                          onChange={e => editClassPos(cls, e.target.value)}
                        >
                          {partsOfSpeech.map(
                            pos => <option value={pos.code} key={pos.code}>{pos.name}</option>
                          )}
                        </select>
                      : partsOfSpeech.find(p => p.code === cls.pos)?.name
                  }
                </td>
                <td>
                  {
                    isDeleted
                      ? <span onClick={() => restoreClass(cls)} className="hover-light-grey">
                          <span className="letter-button letter-button-small letter-button-refresh" />
                        </span>
                      : <span onClick={() => deleteClass(cls)} className="hover-light-grey">
                          <span className="letter-button letter-button-small letter-button-x" />
                        </span>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!classesAreSaved && (
        <>
          <br />
          <SaveChangesButton
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            saveQueryKey={['languages', language.id, 'word-classes', 'update']}
            saveQueryFn={async () => await sendSaveClassesRequest(classesState, language.id)}
            handleSave={data => dispatchClasses({ type: 'markSaved', newClasses: data })}
            style={{ marginTop: "0.8em" }}
          >
            Save changes
          </SaveChangesButton>
        </>
      )}
    </>
  );
}

interface IEditOtherDictSettings {
  language: ILanguage;
  dictSettings: IDictionarySettings;
}

function EditOtherDictSettings({ language, dictSettings }: IEditOtherDictSettings) {
  const [showWordIpa, setShowWordIpa] = useState(dictSettings.showWordIpa);
  const [canEditStems, setCanEditStems] = useState(dictSettings.canEditIrregularStems);

  const [settingsAreSaved, setSettingsAreSaved] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  return (
    <>
      <h3>Other Settings</h3>
      {!settingsAreSaved && (
        <SaveChangesButton
          isSaving={isSavingSettings}
          setIsSaving={setIsSavingSettings}
          saveQueryKey={['languages', language.id, 'dictionary-settings', 'update']}
          saveQueryFn={async () => {
            const newSettings = { showWordIpa, canEditIrregularStems: canEditStems };
            return await sendSaveDictSettingsRequest(newSettings, language.id);
          }}
          handleSave={() => setSettingsAreSaved(true)}
          style={{ marginTop: "1em" }}
        >
          Save
        </SaveChangesButton>
      )}
      <h4 style={{ marginTop: "1em" }}>Show IPA</h4>
      <p>
        Disabling this option will remove the IPA field when adding words and
        viewing the dictionary.
      </p>
      <p>
        <label>
          Show the IPA field?{" "}
          <input
            type="checkbox"
            checked={showWordIpa}
            onChange={e => {
              setShowWordIpa(e.target.checked);
              setSettingsAreSaved(false);
            }}
          />
        </label>
      </p>
      <h4>Irregular Stems</h4>
      <p>
        Enabling this option will allow you to define irregular word stems when
        adding or editing words.
      </p>
      <p>
        <label>
          Allow adding irregular stems?{" "}
          <input
            type="checkbox"
            checked={canEditStems}
            onChange={e => {
              setCanEditStems(e.target.checked);
              setSettingsAreSaved(false);
            }}
          />
        </label>
      </p>
      {!settingsAreSaved && (
        <SaveChangesButton
          isSaving={isSavingSettings}
          setIsSaving={setIsSavingSettings}
          saveQueryKey={['languages', language.id, 'dictionary-settings', 'update']}
          saveQueryFn={async () => {
            const newSettings = { showWordIpa, canEditIrregularStems: canEditStems };
            return await sendSaveDictSettingsRequest(newSettings, language.id);
          }}
          handleSave={() => setSettingsAreSaved(true)}
          style={{ marginTop: "1em" }}
        >
          Save
        </SaveChangesButton>
      )}
    </>
  );
}

interface IEditDictionarySettingsInner {
  language: ILanguage;
  dictSettings: IDictionarySettings;
  classes: IWordClass[];
  partsOfSpeech: IPartOfSpeech[];
}

function EditDictionarySettingsInner(
  { language, dictSettings, classes, partsOfSpeech }: IEditDictionarySettingsInner
) {
  return (
    <>
      <h2>Edit Dictionary Settings</h2>
      <p>
        Edit <Link to={'/language/' + language.id}>{language.name}</Link>'s
        word classes and other dictionary settings.
      </p>
      <EditWordClasses
        language={language}
        initialClasses={classes}
        partsOfSpeech={partsOfSpeech}
      />
      <EditOtherDictSettings
        language={language}
        dictSettings={dictSettings}
      />
    </>
  );
}

export default function EditDictionarySettings() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);
  const dictSettingsResponse = useLanguageDictionarySettings(languageId);
  const classesResponse = useLanguageWordClasses(languageId);
  const partsOfSpeechResponse = usePartsOfSpeech();

  useSetPageTitle("Edit Dictionary Settings");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(dictSettingsResponse.status !== 'success') {
    return renderDatalessQueryResult(dictSettingsResponse);
  }

  if(classesResponse.status !== 'success') {
    return renderDatalessQueryResult(classesResponse);
  }

  if(partsOfSpeechResponse.status !== 'success') {
    return renderDatalessQueryResult(partsOfSpeechResponse);
  }

  return (
    <EditDictionarySettingsInner
      language={languageResponse.data}
      dictSettings={dictSettingsResponse.data}
      classes={classesResponse.data}
      partsOfSpeech={partsOfSpeechResponse.data}
    />
  );
};
