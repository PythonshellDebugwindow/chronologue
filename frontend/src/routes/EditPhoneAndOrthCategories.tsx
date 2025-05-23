import { useReducer, useState } from 'react';
import { Link } from 'react-router-dom';

import { phoneToString } from '@shared/phones';

import SaveChangesButton from '@/components/SaveChangesButton';

import { useLanguage } from '@/hooks/languages';
import {
  useLanguageOrthographyCategories,
  useLanguagePhoneCategories
} from '@/hooks/phones';

import { ILanguage } from '@/types/languages';
import { IPhone } from '@/types/phones';
import { ITitledError } from '@/types/titledError';

import {
  useGetParamsOrSelectedId,
  useSetPageTitle,
  useUnsavedPopup
} from '@/utils/global/hooks';
import {
  getBackendJson,
  renderDatalessQueryResult,
  sendBackendJson
} from '@/utils/global/queries';

interface ICategory {
  letter: string;
  members: string;
}

async function sendSaveCategoriesRequest(
  state: ICategoriesReducerState, type: 'phone' | 'orth', langId: string
) {
  const reqBody = {
    categories: state.categories.filter(category => category.members.length > 0)
  };
  const res = await sendBackendJson(`languages/${langId}/${type}-categories`, 'PUT', reqBody);
  if(!res.ok) {
    throw res.body;
  }
  return res.body;
}

function compareCategories(c1: ICategory, c2: ICategory) {
  return c1.letter.localeCompare(c2.letter);
}

interface ICategoriesReducerState {
  categories: ICategory[];
  saved: boolean;
}

type ICategoriesReducerAction = {
  type: 'add';
  newCategory: ICategory;
} | {
  type: 'edit';
  category: ICategory;
  newLetter?: string;
  newMembers?: string;
} | {
  type: 'markSaved';
  newCategories: ICategory[];
};

function categoriesReducer(state: ICategoriesReducerState, action: ICategoriesReducerAction) {
  const { categories } = state;

  switch(action.type) {
    case 'add': {
      const newCategories = [...categories, action.newCategory];
      newCategories.sort(compareCategories);
      return {
        categories: newCategories,
        saved: false
      };
    }

    case 'edit': {
      const index = categories.indexOf(action.category);
      if(index < 0) {
        return state;
      }
      const newCategory: ICategory = {
        letter: action.newLetter ?? action.category.letter,
        members: action.newMembers ?? action.category.members
      };
      return {
        categories: [
          ...categories.slice(0, index),
          newCategory,
          ...categories.slice(index + 1)
        ],
        saved: false
      };
    }

    case 'markSaved':
      return {
        categories: action.newCategories,
        saved: true
      };

    default:
      throw new Error("Unknown action type: " + (action as any).type);
  }
}

interface IEditSpecificCategories {
  language: ILanguage;
  categoryType: 'phone' | 'orth';
  initialCategories: ICategory[];
}

function EditSpecificCategories({
  language, categoryType, initialCategories
}: IEditSpecificCategories) {
  const [newCategoryLetter, setNewCategoryLetter] = useState("");
  const [newCategoryMembers, setNewCategoryMembers] = useState("");
  const [categoryErrorMessage, setCategoryErrorMessage] = useState("");

  const [categoriesState, dispatchCategories] = useReducer(categoriesReducer, {
    categories: initialCategories.slice().sort(compareCategories), saved: true
  });
  const { categories, saved: categoriesAreSaved } = categoriesState;

  const [isSavingCategories, setIsSavingCategories] = useState(false);

  useUnsavedPopup(!categoriesAreSaved);

  function addNewCategory() {
    if(!newCategoryLetter) {
      setCategoryErrorMessage("Please enter a letter.");
    } else if(!newCategoryMembers) {
      setCategoryErrorMessage("Please enter members.");
    } else {
      dispatchCategories({
        type: 'add',
        newCategory: { letter: newCategoryLetter, members: newCategoryMembers }
      });
      setNewCategoryLetter("");
      setNewCategoryMembers("");
      setCategoryErrorMessage("");
    }
  }

  function editCategoryLetter(category: ICategory, newLetter: string) {
    dispatchCategories({
      type: 'edit',
      category,
      newLetter
    });
  }

  function editCategoryMembers(category: ICategory, newMembers: string) {
    dispatchCategories({
      type: 'edit',
      category,
      newMembers
    });
  }

  function setCategory(type: 'C' | 'V') {
    const typeName = type === 'C' ? 'consonant' : 'vowel';
    getBackendJson(`languages/${language.id}/phones`).then((phones: IPhone[]) => {
      const phonesOfType = phones.filter(p => p.type === typeName);
      const members = (
        categoryType === 'orth'
          ? phonesOfType.map(p => p.graph)
          : phonesOfType.map(p => phoneToString(p))
      ).filter(member => member.length > 0).sort().join(",");
      const letter = type[0].toUpperCase();
      const category = categories.find(category => category.letter === letter);
      if(category) {
        editCategoryMembers(category, members);
      } else {
        dispatchCategories({
          type: 'add',
          newCategory: { letter, members }
        });
      }
    }).catch((error: ITitledError) => {
      setCategoryErrorMessage(error.message);
    });
  }

  return (
    <>
      {categoryErrorMessage && <p><b>{categoryErrorMessage}</b></p>}
      {!categoriesAreSaved && (
        <SaveChangesButton
          isSaving={isSavingCategories}
          setIsSaving={setIsSavingCategories}
          saveQueryKey={['languages', language.id, `${categoryType}-categories`, 'update']}
          saveQueryFn={async () => {
            return await sendSaveCategoriesRequest(categoriesState, categoryType, language.id);
          }}
          handleSave={data => dispatchCategories({ type: 'markSaved', newCategories: data })}
          style={{ marginTop: "0.8em", marginBottom: "0.8em" }}
        >
          Save
        </SaveChangesButton>
      )}
      <table className="settings-table">
        <tbody>
          <tr>
            <th>&nbsp;</th>
            <th>Letter</th>
            <th>Members</th>
            <th>&nbsp;</th>
          </tr>
          <tr>
            <td>
              <span style={{ visibility: "hidden" }}>
                <span className="letter-button letter-button-small letter-button-t" />
              </span>
            </td>
            <td style={{ textAlign: "center" }}>
              <input
                type="text"
                value={newCategoryLetter}
                onChange={e => setNewCategoryLetter(e.target.value.toUpperCase())}
                style={{ width: "1.5em" }}
              />
            </td>
            <td>
              <input
                type="text"
                value={newCategoryMembers}
                onChange={e => setNewCategoryMembers(e.target.value)}
              />
            </td>
            <td>
              <span className="hover-light-grey" onClick={addNewCategory}>
                <span className="letter-button letter-button-small letter-button-t" />
              </span>
            </td>
          </tr>
          {categories.map((category, i) => (
            <tr key={i}>
              <td>&nbsp;</td>
              <td style={{ textAlign: "center" }}>
                <input
                  type="text"
                  value={category.letter}
                  onChange={e => editCategoryLetter(category, e.target.value.toUpperCase())}
                  style={{ width: "1.5em" }}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={category.members}
                  onChange={e => editCategoryMembers(category, e.target.value)}
                />
              </td>
              <td>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: "10px" }}>
        <button
          onClick={() => setCategory('C')}
          style={{ marginRight: "10px" }}
        >
          ↻ Consonants
        </button>
        <button onClick={() => setCategory('V')}>
          ↻ Vowels
        </button>
      </div>
      {!categoriesAreSaved && (
        <SaveChangesButton
          isSaving={isSavingCategories}
          setIsSaving={setIsSavingCategories}
          saveQueryKey={['languages', language.id, `${categoryType}-categories`, 'update']}
          saveQueryFn={async () => {
            return await sendSaveCategoriesRequest(categoriesState, categoryType, language.id);
          }}
          handleSave={data => dispatchCategories({ type: 'markSaved', newCategories: data })}
          style={{ marginTop: "0.8em" }}
        >
          Save
        </SaveChangesButton>
      )}
    </>
  );
}

interface IEditCategoriesInner {
  language: ILanguage;
  orthCategories: ICategory[];
  phoneCategories: ICategory[];
}

function EditCategoriesInner({ language, orthCategories, phoneCategories }: IEditCategoriesInner) {
  return (
    <>
      <h2>Edit Categories</h2>
      <p>
        Editing <Link to={'/language/' + language.id}>{language.name}</Link>'s
        orthography and phonology categories.
      </p>
      <p>
        Members should be separated by commas, with no spaces.
        Empty categories will be removed upon saving.
      </p>
      <h4>Orthography Categories</h4>
      <p>Used when rewriting words (e.g. in grammar tables).</p>
      <EditSpecificCategories
        language={language}
        categoryType="orth"
        initialCategories={orthCategories}
      />
      <h4>Phone Categories</h4>
      <p>
        Used when rewriting IPA (e.g. when {" "}
        <Link to={'/estimate-ipa/' + language.id}>estimating pronunciation</Link>
        ).
      </p>
      <EditSpecificCategories
        language={language}
        categoryType="phone"
        initialCategories={phoneCategories}
      />
    </>
  );
}

export default function EditPhoneAndOrthCategories() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);
  const orthCategoriesResponse = useLanguageOrthographyCategories(languageId);
  const phoneCategoriesResponse = useLanguagePhoneCategories(languageId);

  useSetPageTitle("Edit Categories");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(orthCategoriesResponse.status !== 'success') {
    return renderDatalessQueryResult(orthCategoriesResponse);
  }

  if(phoneCategoriesResponse.status !== 'success') {
    return renderDatalessQueryResult(phoneCategoriesResponse);
  }

  const orthCategories = orthCategoriesResponse.data.map(c => (
    { letter: c.letter, members: c.members.join(",") }
  ));
  const phoneCategories = phoneCategoriesResponse.data.map(c => (
    { letter: c.letter, members: c.members.join(",") }
  ));

  return (
    <EditCategoriesInner
      language={languageResponse.data}
      orthCategories={orthCategories}
      phoneCategories={phoneCategories}
    />
  );
};
