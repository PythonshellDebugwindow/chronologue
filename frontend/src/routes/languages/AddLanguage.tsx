import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { CForm, CFormBody, CSelect, CTextInput } from '@/components/CForm';

import SelectedLanguageContext from '@/contexts/SelectedLanguageContext';

import { useFamilies, useFamilyMembers } from '@/hooks/families';

import { useSetPageTitle } from '@/utils/global/hooks';
import { sendBackendJson } from '@/utils/global/queries';

interface IParentSelect {
  familyId: string;
  parentId: string;
  setParentId: Dispatch<SetStateAction<string>>;
}

function ParentSelect({ familyId, parentId, setParentId }: IParentSelect) {
  const { isPending, error, data: languages } = useFamilyMembers(familyId);

  useEffect(() => {
    if(languages && languages.length > 0 && !parentId) {
      setParentId(languages[0].id);
    }
  }, [languages, parentId, setParentId])

  if(isPending) {
    return (
      <tr>
        <td>Parent:</td>
        <td>Loading...</td>
      </tr>
    );
  } else if(error) {
    return (
      <tr>
        <td>Parent:</td>
        <td>{error.message}</td>
      </tr>
    );
  }

  return (
    <CSelect
      label="Parent"
      name="parentId"
      state={parentId}
      setState={setParentId}
    >
      {
        languages.length > 0
          ? languages.map(language => (
              <option value={language.id} key={language.id}>{language.name}</option>
            ))
          : <option value="">(root)</option>
      }
    </CSelect>
  );
}

type IFamilySelect = IParentSelect & {
  setFamilyId: Dispatch<SetStateAction<string>>;
};

function FamilySelect({ familyId, setFamilyId, parentId, setParentId }: IFamilySelect) {
  const { isPending, error, data: families } = useFamilies();
  if(isPending) {
    return <tr><td>Family:</td><td>Loading...</td></tr>;
  } else if(error) {
    return <tr><td>Family:</td><td>{error.message}</td></tr>;
  }

  return (
    <>
      <CSelect
        label="Family"
        name="familyId"
        state={familyId}
        setState={setFamilyId}
      >
        <option value="">None</option>
        {families.map(family => (
          <option value={family.id} key={family.id}>
            {family.name}
          </option>
        ))}
      </CSelect>
      {familyId && (
        <ParentSelect
          familyId={familyId}
          parentId={parentId}
          setParentId={setParentId}
        />
      )}
    </>
  );
}

export default function AddLanguage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setSelectedLanguage } = useContext(SelectedLanguageContext);

  const [name, setName] = useState("");
  const [autonym, setAutonym] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [parentId, setParentId] = useState("");
  const [status, setStatus] = useState("living");
  const [era, setEra] = useState("");
  const [message, setMessage] = useState("");

  useSetPageTitle("Add Language");

  async function addFormLanguage() {
    if(!name) {
      setMessage("Please enter a language name.");
      return;
    }

    const data = { name, autonym, familyId, parentId, status, era };
    const result = await sendBackendJson('languages', 'POST', data);
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }

    setSelectedLanguage({ id: result.body, name });
    navigate('/language/' + result.body);
  }

  return (
    <>
      <h2>Add Language</h2>
      <p>Add a language.</p>
      {location.state?.mustBefore && (
        <p><b>You need to add a language before {location.state.mustBefore}.</b></p>
      )}
      {message && <p><b>{message}</b></p>}
      <CForm>
        <CFormBody>
          <CTextInput
            label="Name"
            name="name"
            state={name}
            setState={setName}
          />
          <CTextInput
            label="Autonym"
            name="autonym"
            state={autonym}
            setState={setAutonym}
          />
          <FamilySelect
            familyId={familyId}
            setFamilyId={setFamilyId}
            parentId={parentId}
            setParentId={setParentId}
          />
          <CSelect
            label="Status"
            name="status"
            state={status}
            setState={setStatus}
          >
            <option value="living">Living</option>
            <option value="dead">Dead</option>
            <option value="proto">Proto</option>
          </CSelect>
          <CTextInput
            label="Era"
            name="era"
            state={era}
            setState={setEra}
          />
        </CFormBody>
        <button type="button" onClick={addFormLanguage}>
          Add Language
        </button>
      </CForm>
    </>
  );
}
