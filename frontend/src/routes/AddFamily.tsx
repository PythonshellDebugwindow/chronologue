import { json, redirect, useActionData, ActionFunctionArgs } from 'react-router-dom';

import {
  CForm, CFormBody, CMultilineTextInput, CTextInput
} from '../components/CForm.tsx';

import { useSetPageTitle } from '@/utils/global/hooks';
import { getFormJson, sendBackendJson } from '@/utils/global/queries';

export async function action({ request }: ActionFunctionArgs) {
  const formJson = await getFormJson(request);

  if(!formJson.name) {
    return json({ message: "Please enter a language name" });
  }

  const data = {
    name: formJson.name,
    description: formJson.description
  };
  const result = await sendBackendJson('families', 'POST', data);
  if(!result.ok) {
    return json({ message: result.body.message });
  }

  return redirect('/family/' + result.body);
};

export default function AddFamily() {
  const actionData: any = useActionData();

  useSetPageTitle("Add Family");

  return (
    <>
      <h2>Add Family</h2>
      <p>Add a language family.</p>
      {actionData?.message && <p><b>{actionData.message}</b></p>}
      <CForm action="/add-family">
        <CFormBody>
          <CTextInput
            label="Name"
            name="name"
          />
          <CMultilineTextInput
            label="Description"
            name="description"
          />
        </CFormBody>
        <button type="submit">Add Family</button>
      </CForm>
    </>
  );
};
