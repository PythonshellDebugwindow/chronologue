import { useReducer, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  LetterButtonPlus,
  LetterButtonRefresh,
  LetterButtonX
} from '@/components/LetterButtons';
import SaveChangesButton from '@/components/SaveChangesButton';
import { SettingsTable, SettingsTableRow } from '@/components/SettingsTable';

import { useArticleFolders } from '@/hooks/articles';

import { IArticleFolder } from '@/types/articles';

import { useSetPageTitle, useUnsavedPopup } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

const UNADDED_FOLDER_ID = "";

async function sendSaveFoldersRequest(state: IFoldersReducerState) {
  const newFolders = state.folders.filter(folder => !state.deleted.includes(folder.id));
  const reqBody = {
    new: newFolders.map(folder => ({
      ...folder, id: folder.id !== UNADDED_FOLDER_ID ? folder.id : null
    })),
    deleted: state.deleted
  };
  const res = await sendBackendJson('article-folders', 'PUT', reqBody);
  if(!res.ok) {
    throw res.body;
  }
  return res.body;
}

function compareFolders(f1: IArticleFolder, f2: IArticleFolder) {
  return f1.name.localeCompare(f2.name);
}

interface IFoldersReducerState {
  folders: IArticleFolder[];
  deleted: string[];
  saved: boolean;
}

type IFoldersReducerAction = {
  type: 'add';
  newFolder: IArticleFolder;
} | {
  type: 'edit';
  folder: IArticleFolder;
  newName: string;
} | {
  type: 'delete';
  folder: IArticleFolder;
} | {
  type: 'restore';
  folder: IArticleFolder;
} | {
  type: 'markSaved';
  newFolders: IArticleFolder[];
};

function foldersReducer(state: IFoldersReducerState, action: IFoldersReducerAction) {
  const { folders, deleted } = state;

  switch(action.type) {
    case 'add': {
      const newFolders = [...folders, action.newFolder];
      newFolders.sort(compareFolders);
      return {
        folders: newFolders,
        deleted,
        saved: false
      };
    }

    case 'edit': {
      const index = folders.indexOf(action.folder);
      if(index < 0) {
        return state;
      }
      const newFolder: IArticleFolder = {
        id: action.folder.id,
        name: action.newName
      };
      return {
        folders: [
          ...folders.slice(0, index),
          newFolder,
          ...folders.slice(index + 1)
        ],
        deleted,
        saved: false
      };
    }

    case 'delete':
      if(action.folder.id === UNADDED_FOLDER_ID) {
        return {
          folders: folders.filter(folder => folder !== action.folder),
          deleted,
          saved: false
        };
      } else {
        return {
          folders,
          deleted: [...deleted, action.folder.id],
          saved: false
        };
      }

    case 'restore':
      return {
        folders,
        deleted: deleted.filter(id => id !== action.folder.id),
        saved: false
      };

    case 'markSaved':
      return {
        folders: action.newFolders,
        deleted: [],
        saved: true
      };

    default:
      throw new Error("Unknown action type: " + (action as any).type);
  }
}

function EditArticleFoldersInner({ initialFolders }: { initialFolders: IArticleFolder[] }) {
  const queryClient = useQueryClient();

  const [newFolderName, setNewFolderName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [foldersState, dispatchFolders] = useReducer(foldersReducer, {
    folders: initialFolders.slice().sort(compareFolders), deleted: [], saved: true
  });
  const { folders, deleted: deletedFolders, saved: foldersAreSaved } = foldersState;

  const [isSaving, setIsSaving] = useState(false);

  useUnsavedPopup(!foldersAreSaved);

  function addNewFolder() {
    dispatchFolders({
      type: 'add',
      newFolder: { id: UNADDED_FOLDER_ID, name: newFolderName }
    });
    setNewFolderName("");
    setErrorMessage("");
  }

  function deleteFolder(folder: IArticleFolder) {
    dispatchFolders({
      type: 'delete',
      folder
    });
  }

  function restoreFolder(folder: IArticleFolder) {
    dispatchFolders({
      type: 'restore',
      folder
    });
  }

  function editFolderName(folder: IArticleFolder, newName: string) {
    dispatchFolders({
      type: 'edit',
      folder,
      newName
    });
  }

  async function saveFolders() {
    const response = await sendSaveFoldersRequest(foldersState);
    queryClient.resetQueries({ queryKey: ['article-folders'] });
    return response;
  }

  return (
    <>
      <h2>Edit Article Folders</h2>
      <p>Edit the list of article folders.</p>
      {errorMessage && <p><b>{errorMessage}</b></p>}
      {!foldersAreSaved && (
        <SaveChangesButton
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          saveQueryKey={['article-folders update']}
          saveQueryFn={saveFolders}
          handleSave={data => dispatchFolders({ type: 'markSaved', newFolders: data })}
          style={{ marginBottom: "0.8em" }}
        >
          Save changes
        </SaveChangesButton>
      )}
      <SettingsTable>
        <tr>
          <th>Name</th>
          <th>&nbsp;</th>
        </tr>
        <tr>
          <td>
            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
            />
          </td>
          <td>
            <LetterButtonPlus onClick={addNewFolder} />
          </td>
        </tr>
        {folders.map((folder, i) => {
          const isDeleted = deletedFolders.includes(folder.id);
          return (
            <SettingsTableRow deleted={isDeleted} key={i}>
              <td>
                <input
                  type="text"
                  value={folder.name}
                  onChange={e => editFolderName(folder, e.target.value)}
                  disabled={isDeleted}
                />
              </td>
              <td>
                {
                  isDeleted
                    ? <LetterButtonRefresh onClick={() => restoreFolder(folder)} />
                    : <LetterButtonX onClick={() => deleteFolder(folder)} />
                }
              </td>
            </SettingsTableRow>
          );
        })}
      </SettingsTable>
      {!foldersAreSaved && (
        <SaveChangesButton
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          saveQueryKey={['article-folders update']}
          saveQueryFn={saveFolders}
          handleSave={data => dispatchFolders({ type: 'markSaved', newFolders: data })}
          style={{ marginTop: "1em" }}
        >
          Save changes
        </SaveChangesButton>
      )}
    </>
  );
}

export default function EditArticleFolders() {
  const foldersResponse = useArticleFolders();

  useSetPageTitle("Edit Article Folders");

  if(foldersResponse.status !== 'success') {
    return renderDatalessQueryResult(foldersResponse);
  }

  return (
    <EditArticleFoldersInner
      initialFolders={foldersResponse.data}
    />
  );
}
