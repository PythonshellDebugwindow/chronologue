import { useContext, useEffect, useState } from 'react';
import { json, useActionData, useLocation, useNavigate, ActionFunctionArgs } from 'react-router-dom';

import { CForm, CFormBody, CSelect, CTextInput } from '../components/CForm.tsx';

import { useFamilies, useFamilyMembers } from '../familyData.tsx';
import { addLanguage } from '../languageData.tsx';
import SelectedLanguageContext from '../SelectedLanguageContext.tsx';
import { getFormJson, useSetPageTitle } from '../utils.tsx';

export async function action({ request }: ActionFunctionArgs) {
  const formJson = await getFormJson(request);

  if(!formJson.name) {
    return json({ message: "Please enter a language name" });
  }
  
  const result = await addLanguage(formJson as any);
  if(!result.ok) {
    return json({ message: result.body.message });
  }

  return json({ addedId: result.body, addedName: formJson.name });
};

function LanguageSelect({ familyId }: { familyId: string }) {
  const { isPending, error, data: languages } = useFamilyMembers(familyId);
  if(isPending) {
    return <tr><td>Parent:</td><td>Loading...</td></tr>;
  } else if(error) {
    return <tr><td>Parent:</td><td>{ error.message }</td></tr>;
  }
  
  return (
    <CSelect label="Parent" name="parentId">
      {
        languages.length > 0
        ? languages.map(language => <option value={ language.id } key={ language.id }>{ language.name }</option>)
        : <option value="">(root)</option>
      }
    </CSelect>
  );
}

function ParentSelect() {
  const [ familyId, setFamilyId ] = useState("");
  
  const { isPending, error, data: families } = useFamilies();
  if(isPending) {
    return <tr><td>Family:</td><td>Loading...</td></tr>;
  } else if(error) {
    return <tr><td>Family:</td><td>{ error.message }</td></tr>;
  }
  
  return (
    <>
      <CSelect label="Family" name="familyId" state={familyId} setState={setFamilyId}>
        <option value="">None</option>
        { families.map(family => <option value={ family.id } key={ family.id }>{ family.name }</option>) }
      </CSelect>
      { familyId && <LanguageSelect familyId={familyId} /> }
    </>
  );
}

export default function AddLanguage() {
  const actionData: any = useActionData();
  const location = useLocation();
  const navigate = useNavigate();
  const { setSelectedLanguage } = useContext(SelectedLanguageContext);
  
  useEffect(() => {
    if(actionData?.addedId) {
      setSelectedLanguage({ id: actionData.addedId, name: actionData.addedName });
      navigate('/language/' + actionData.addedId);
    }
  }, [actionData, navigate, setSelectedLanguage]);
  
  useSetPageTitle("Add Language");

  return (
    <>
      <h2>Add Language</h2>
      <p>Add a language.</p>
      { location.state?.mustBefore && <p><b>You need to add a language before { location.state.mustBefore }.</b></p> }
      { actionData?.message && <p><b>{ actionData.message }</b></p> }
      <CForm action="/add-language">
        <CFormBody>
          <CTextInput label="Name" name="name" />
          <CTextInput label="Autonym" name="autonym" />
          <ParentSelect />
          <CSelect label="Status" name="status">
            <option value="living">Living</option>
            <option value="dead">Dead</option>
            <option value="proto">Proto</option>
          </CSelect>
          <CTextInput label="Era" name="era" />
        </CFormBody>
        <button type="submit">Add Language</button>
      </CForm>
    </>
  )
};
