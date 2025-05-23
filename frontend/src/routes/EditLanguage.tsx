import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { CFormBody, CSelect, CTextInput } from '@/components/CForm';

import SelectedLanguageContext from '@/contexts/SelectedLanguageContext';

import { useFamilies, useFamilyMembers } from '@/hooks/families';
import { useLanguage } from '@/hooks/languages';

import { ILanguage, LanguageStatus } from '@/types/languages';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

interface IParentSelect {
  familyId: string;
  parentId: string;
  setParentId: Dispatch<SetStateAction<string>>;
  child: ILanguage;
}

function ParentSelect({ familyId, parentId, setParentId, child }: IParentSelect) {
  const response = useFamilyMembers(familyId);
  const languages = response.data?.filter(lang => lang.id !== child.id);

  useEffect(() => {
    const isInAnotherFamily = familyId !== "" && familyId !== child.familyId;
    if(languages && isInAnotherFamily && !parentId && languages.length > 0) {
      setParentId(languages[0].id);
    }
  }, [languages, familyId, child, parentId, setParentId]);

  if(response.status === 'pending') {
    return (
      <tr>
        <td>Parent:</td>
        <td>Loading...</td>
      </tr>
    );
  } else if(response.status === 'error') {
    return (
      <tr>
        <td>Parent:</td>
        <td>{response.error.message}</td>
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
        (languages!.length === 0 || familyId === child.familyId && !child.parentId)
          ? <option value="">(root)</option>
          : languages!.map(language => (
              <option value={language.id} key={language.id}>{language.name}</option>
            ))
      }
    </CSelect>
  );
}

interface IFamilyAndLanguageSelect {
  familyId: string;
  setFamilyId: Dispatch<SetStateAction<string>>;
  parentId: string;
  setParentId: Dispatch<SetStateAction<string>>;
  child: ILanguage;
}

function FamilyAndLanguageSelect({ familyId, setFamilyId, parentId, setParentId, child }: IFamilyAndLanguageSelect) {
  const { isPending, error, data: families } = useFamilies();
  if(isPending) {
    return (
      <tr>
        <td>Family:</td>
        <td>Loading...</td>
      </tr>
    );
  } else if(error) {
    return (
      <tr>
        <td>Family:</td>
        <td>{error.message}</td>
      </tr>
    );
  }

  function setFamilyIdWrapper(id: string) {
    setFamilyId(id);
    setParentId("");
  }

  return (
    <>
      <CSelect
        label="Family"
        name="familyId"
        state={familyId}
        setState={setFamilyIdWrapper}
      >
        <option value="">(none)</option>
        {families.map(family => (
          <option value={family.id} key={family.id}>{family.name}</option>
        ))}
      </CSelect>
      {familyId && (
        <ParentSelect
          familyId={familyId}
          child={child}
          parentId={parentId}
          setParentId={setParentId}
        />
      )}
    </>
  );
}

function EditLanguageInner({ initialLanguage }: { initialLanguage: ILanguage }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { selectedLanguage, setSelectedLanguage } = useContext(SelectedLanguageContext);

  const [name, setName] = useState(initialLanguage.name);
  const [autonym, setAutonym] = useState(initialLanguage.autonym);
  const [familyId, setFamilyId] = useState(initialLanguage.familyId ?? "");
  const [parentId, setParentId] = useState(initialLanguage.parentId ?? "");
  const [status, setStatus] = useState(initialLanguage.status);
  const [era, setEra] = useState(initialLanguage.era);
  const [errorMessage, setErrorMessage] = useState("");

  async function editFormLanguage() {
    if(!name) {
      setErrorMessage("Please enter a name");
      return;
    }

    const data = {
      name,
      autonym,
      familyId: familyId || null,
      parentId: parentId || null,
      status,
      era
    };
    const result = await sendBackendJson(`languages/${initialLanguage.id}`, 'PUT', data);
    if(!result.ok) {
      setErrorMessage(result.body.message);
      return;
    }

    queryClient.resetQueries({ queryKey: ['languages', initialLanguage.id] });
    if(selectedLanguage?.id === initialLanguage.id) {
      setSelectedLanguage({ id: selectedLanguage.id, name });
    }
    navigate(`/language/${initialLanguage.id}`);
  }

  return (
    <>
      <h2>Edit Language</h2>
      {errorMessage && <p>{errorMessage}</p>}
      <form className="chronologue-form">
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
          <FamilyAndLanguageSelect
            familyId={familyId}
            setFamilyId={setFamilyId}
            child={initialLanguage}
            parentId={parentId}
            setParentId={setParentId}
          />
          <CSelect
            label="Status"
            name="status"
            state={status}
            setState={value => setStatus(value as LanguageStatus)}
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
        <button type="button" onClick={editFormLanguage}>
          Save changes
        </button>
        <button type="button" onClick={() => navigate('/language/' + initialLanguage.id)}>
          Back
        </button>
      </form>
      <h4>Summary Notes</h4>
      <p>
        Provide a description of {initialLanguage.name} as a whole, and notes
        about its phonology and orthography.</p>
      <p>
        <Link to={'/summary-notes/' + initialLanguage.id}>
          Edit summary notes
        </Link>
      </p>
      <h4>Delete Language</h4>
      <p>
        <Link to={'/delete-language/' + initialLanguage.id}>
          Delete {initialLanguage.name}
        </Link>
      </p>
    </>
  );
}

export default function EditLanguage() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);

  useSetPageTitle("Edit Language");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  return <EditLanguageInner initialLanguage={languageResponse.data} />;
};
