import { useState } from 'react';

import { InfoParagraph } from '@/components/Paragraphs';
import SaveChangesButton from '@/components/SaveChangesButton';

import { useSwadeshList } from '@/hooks/words';

import {
  useGetParamsOrSelectedId,
  useSetPageTitle,
  useUnsavedPopup
} from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

async function sendSaveListRequest(newList: string) {
  const list = newList.split("\n").map(word => word.trim());
  const res = await sendBackendJson('swadesh-list', 'PUT', { list });
  if(!res.ok) {
    throw res.body;
  }
  return res.body;
}

function EditSwadeshListInner({ initialList }: { initialList: string[] }) {
  const [newList, setNewList] = useState(initialList.join("\n"));
  const [listIsSaved, setListIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useUnsavedPopup(!listIsSaved);

  return (
    <>
      <h2>Edit Swadesh List</h2>
      <InfoParagraph>
        Editing the global Swadesh list. Each line is its own entry. Any text in parentheses is ignored.
      </InfoParagraph>
      <InfoParagraph>
        The <a href="https://en.wikipedia.org/wiki/Swadesh_list#Swadesh_207_list">Swadesh 207 list</a>
        {" "}can be a good one to copy from.
      </InfoParagraph>
      {!listIsSaved && (
        <SaveChangesButton
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          saveQueryKey={['swadesh-list', 'update']}
          saveQueryFn={async () => await sendSaveListRequest(newList)}
          handleSave={() => setListIsSaved(true)}
          style={{ marginBottom: "0.8em" }}
        >
          Save changes
        </SaveChangesButton>
      )}
      <textarea
        value={newList}
        onChange={e => {
          setNewList(e.target.value);
          setListIsSaved(false);
        }}
        style={{ width: "50%", height: "20em", fontSize: "1em" }}
      />
      {!listIsSaved && (
        <SaveChangesButton
          isSaving={isSaving}
          setIsSaving={setIsSaving}
          saveQueryKey={['swadesh-list', 'update']}
          saveQueryFn={async () => await sendSaveListRequest(newList)}
          handleSave={() => setListIsSaved(true)}
          style={{ marginBottom: "0.8em" }}
        >
          Save changes
        </SaveChangesButton>
      )}
    </>
  );
}

export default function EditSwadeshList() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }

  const listResponse = useSwadeshList();

  useSetPageTitle("Edit Swadesh List");

  if(listResponse.status !== 'success') {
    return renderDatalessQueryResult(listResponse);
  }

  return (
    <EditSwadeshListInner initialList={listResponse.data} />
  );
}
