import { useReducer, useState } from 'react';
import { Link } from 'react-router-dom';

import SaveChangesButton from '@/components/SaveChangesButton';

import { useLanguageWordStems } from '@/hooks/grammar';
import { useLanguage } from '@/hooks/languages';
import { usePartsOfSpeech } from '@/hooks/words';

import { IWordStem } from '@/types/grammar';
import { ILanguage } from '@/types/languages';
import { IPartOfSpeech } from '@/types/words';

import {
  useGetParamsOrSelectedId,
  useSetPageTitle,
  useUnsavedPopup
} from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

const UNADDED_STEM_ID = "";

async function sendSaveStemsRequest(state: IStemsReducerState, langId: string) {
  const newStems = state.stems.filter(
    stem => !state.deleted.includes(stem.id)
  );
  const reqBody = {
    new: newStems.map(stem => ({
      ...stem, id: stem.id !== UNADDED_STEM_ID ? stem.id : null
    })),
    deleted: state.deleted
  };
  const res = await sendBackendJson(`languages/${langId}/word-stems`, 'PUT', reqBody);
  if(!res.ok) {
    throw res.body;
  }
  return res.body;
}

function compareStems(s1: IWordStem, s2: IWordStem) {
  if(s1.pos !== s2.pos) {
    return s1.pos.localeCompare(s2.pos);
  } else if(s1.name !== s2.name) {
    return s1.name.localeCompare(s2.name);
  } else {
    return s1.id.localeCompare(s2.id);
  }
}

interface IStemsReducerState {
  stems: IWordStem[];
  deleted: string[];
  saved: boolean;
}

type IStemsReducerAction = {
  type: 'add';
  newStem: IWordStem;
} | {
  type: 'edit';
  stem: IWordStem;
  newPos?: string;
  newName?: string;
  newRules?: string;
} | {
  type: 'delete';
  stem: IWordStem;
} | {
  type: 'restore';
  stem: IWordStem;
} | {
  type: 'markSaved';
  newStems: IWordStem[];
};

function stemsReducer(state: IStemsReducerState, action: IStemsReducerAction) {
  const { stems, deleted } = state;

  switch(action.type) {
    case 'add': {
      const newStems = [...stems, action.newStem];
      newStems.sort(compareStems);
      return {
        stems: newStems,
        deleted,
        saved: false
      };
    }

    case 'edit': {
      const index = stems.indexOf(action.stem);
      if(index < 0) {
        return state;
      }
      const newStem: IWordStem = {
        id: action.stem.id,
        pos: action.newPos ?? action.stem.pos,
        name: action.newName ?? action.stem.name,
        rules: action.newRules ?? action.stem.rules
      };
      return {
        stems: [
          ...stems.slice(0, index),
          newStem,
          ...stems.slice(index + 1)
        ],
        deleted,
        saved: false
      };
    }

    case 'delete':
      if(action.stem.id === UNADDED_STEM_ID) {
        return {
          stems: stems.filter(stem => stem !== action.stem),
          deleted,
          saved: false
        };
      } else {
        return {
          stems,
          deleted: [...deleted, action.stem.id],
          saved: false
        };
      }

    case 'restore':
      return {
        stems,
        deleted: deleted.filter(id => id !== action.stem.id),
        saved: false
      };

    case 'markSaved':
      return {
        stems: action.newStems,
        deleted: [],
        saved: true
      };

    default:
      throw new Error("Unknown action type: " + (action as any).type);
  }
}

interface IEditStemsInner {
  language: ILanguage;
  initialStems: IWordStem[];
  partsOfSpeech: IPartOfSpeech[];
}

function EditStemsInner({ language, initialStems, partsOfSpeech }: IEditStemsInner) {
  const [newStemPos, setNewStemPos] = useState("");
  const [newStemName, setNewStemName] = useState("");
  const [newStemRules, setNewStemRules] = useState("");
  const [stemErrorMessage, setStemErrorMessage] = useState("");

  const [stemsState, dispatchStems] = useReducer(stemsReducer, {
    stems: initialStems.slice().sort(compareStems), deleted: [], saved: true
  });
  const { stems, deleted: deletedStems, saved: stemsAreSaved } = stemsState;

  const [isSaving, setIsSaving] = useState(false);

  useUnsavedPopup(!stemsAreSaved);

  function addNewStem() {
    const pos = newStemPos;
    const name = newStemName;
    const rules = newStemRules;
    if(!pos) {
      setStemErrorMessage("Please choose a part of speech.");
    } else {
      dispatchStems({
        type: 'add',
        newStem: { id: UNADDED_STEM_ID, pos, name, rules }
      });
      setNewStemRules("");
      setNewStemName("");
      setStemErrorMessage("");
    }
  }

  function deleteStem(stem: IWordStem) {
    dispatchStems({
      type: 'delete',
      stem
    });
  }

  function restoreStem(stem: IWordStem) {
    dispatchStems({
      type: 'restore',
      stem
    });
  }

  function editStemName(stem: IWordStem, newName: string) {
    dispatchStems({
      type: 'edit',
      stem,
      newName
    });
  }

  function editStemPos(stem: IWordStem, newPos: string) {
    dispatchStems({
      type: 'edit',
      stem,
      newPos
    });
  }

  function editStemRules(stem: IWordStem, newRules: string) {
    dispatchStems({
      type: 'edit',
      stem,
      newRules
    });
  }

  return (
    <>
      <h2>Edit Stems</h2>
      <p>
        Edit <Link to={'/language/' + language.id}>{language.name}</Link>'s word stems.
      </p>
      {stemErrorMessage && <p><b>{stemErrorMessage}</b></p>}
      {!stemsAreSaved && (
        <SaveChangesButton
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          saveQueryKey={['languages', language.id, 'word-stems', 'update']}
          saveQueryFn={async () => await sendSaveStemsRequest(stemsState, language.id)}
          handleSave={data => dispatchStems({ type: 'markSaved', newStems: data })}
          style={{ marginBottom: "0.8em" }}
        >
          Save changes
        </SaveChangesButton>
      )}
      <table className="settings-table settings-table-top">
        <tbody>
          <tr>
            <th>Name</th>
            <th><abbr title="part of speech">POS</abbr></th>
            <th>Rules</th>
            <th>&nbsp;</th>
          </tr>
          <tr>
            <td>
              <input
                type="text"
                value={newStemName}
                onChange={e => setNewStemName(e.target.value)}
              />
            </td>
            <td>
              <select
                value={newStemPos}
                onChange={e => setNewStemPos(e.target.value)}
              >
                <option value="">---</option>
                {partsOfSpeech.map(
                  pos => <option value={pos.code} key={pos.code}>{pos.name}</option>
                )}
              </select>
            </td>
            <td>
              <textarea
                value={newStemRules}
                onChange={e => setNewStemRules(e.target.value)}
              />
            </td>
            <td>
              <span className="hover-light-grey" onClick={() => addNewStem()}>
                <span className="letter-button letter-button-small letter-button-t" />
              </span>
            </td>
          </tr>
          {stems.map((stem, i) => {
            const isDeleted = deletedStems.includes(stem.id);
            return (
              <tr key={i} className={isDeleted ? "deleted-row" : undefined}>
                <td>
                  <input
                    type="text"
                    value={stem.name}
                    onChange={e => editStemName(stem, e.target.value)}
                    disabled={isDeleted}
                  />
                </td>
                <td>
                  {
                    stem.id === UNADDED_STEM_ID
                      ? <select
                          value={stem.pos}
                          onChange={e => editStemPos(stem, e.target.value)}
                        >
                          {partsOfSpeech.map(
                            pos => <option value={pos.code} key={pos.code}>{pos.name}</option>
                          )}
                        </select>
                      : partsOfSpeech.find(p => p.code === stem.pos)?.name
                  }
                </td>
                <td>
                  <textarea
                    value={stem.rules}
                    onChange={e => editStemRules(stem, e.target.value)}
                    disabled={isDeleted}
                  />
                </td>
                <td>
                  {
                    isDeleted
                      ? <span onClick={() => restoreStem(stem)} className="hover-light-grey">
                          <span className="letter-button letter-button-small letter-button-refresh" />
                        </span>
                      : <span onClick={() => deleteStem(stem)} className="hover-light-grey">
                          <span className="letter-button letter-button-small letter-button-x" />
                        </span>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!stemsAreSaved && (
        <SaveChangesButton
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          saveQueryKey={['languages', language.id, 'word-stems', 'update']}
          saveQueryFn={async () => await sendSaveStemsRequest(stemsState, language.id)}
          handleSave={data => dispatchStems({ type: 'markSaved', newStems: data })}
          style={{ marginTop: "0.8em" }}
        >
          Save changes
        </SaveChangesButton>
      )}
    </>
  );
}

export default function EditStems() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);
  const stemsResponse = useLanguageWordStems(languageId);
  const partsOfSpeechResponse = usePartsOfSpeech();

  useSetPageTitle("Edit Dictionary Settings");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(stemsResponse.status !== 'success') {
    return renderDatalessQueryResult(stemsResponse);
  }

  if(partsOfSpeechResponse.status !== 'success') {
    return renderDatalessQueryResult(partsOfSpeechResponse);
  }

  return (
    <EditStemsInner
      language={languageResponse.data}
      initialStems={stemsResponse.data}
      partsOfSpeech={partsOfSpeechResponse.data}
    />
  );
}
