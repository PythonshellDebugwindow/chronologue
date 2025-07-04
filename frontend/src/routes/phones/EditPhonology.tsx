import { useReducer, useState, Dispatch } from 'react';
import { Link } from 'react-router-dom';
import ReactSelect from 'react-select';

import { phoneToString, qualityData } from '@shared/phones';

import { LetterButtonXNoShadow } from '@/components/LetterButtons';
import { PhoneTable, PhoneTableCell } from '@/components/PhoneTable';
import SaveChangesButton from '@/components/SaveChangesButton';

import { useLanguage } from '@/hooks/languages';
import { useLanguagePhones } from '@/hooks/phones';

import { ILanguage } from '@/types/languages';
import { IPhone, IPhoneTableData, PhoneType } from '@/types/phones';

import {
  useGetParamsOrSelectedId,
  useSetPageTitle,
  useUnsavedPopup
} from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

import { consonantData, hasDoubleWidthCell, vowelData } from '@/utils/phones';

import styles from './EditPhonology.module.css';

interface IPhoneTableHalfCell {
  type: PhoneType;
  phone: string;
  addedPhones: IPhone[];
  addPhone: (base: string) => void;
  colSpan?: number;
}

function PhoneTableHalfCell({ type, phone, addedPhones, addPhone, colSpan = 1 }: IPhoneTableHalfCell) {
  const isAdded = addedPhones.some(ap => ap.base === phone && ap.type === type);
  return (
    <PhoneTableCell
      added={isAdded}
      onClick={() => addPhone(phone)}
      colSpan={colSpan}
    >
      {phone}
    </PhoneTableCell>
  );
}

interface IPhoneTableCells {
  data: IPhoneTableData;
  addedPhones: IPhone[];
  addPhone: (base: string) => void;
  row: number;
  col: number;
}

function PhoneTableCells({ data, addedPhones, addPhone, row, col }: IPhoneTableCells) {
  const hasLeft = data.phones[row][col * 2];
  const hasRight = data.phones[row][col * 2 + 1];
  if(!hasLeft && !hasRight) {
    return <td colSpan={2}>&nbsp;</td>;
  }
  if(hasDoubleWidthCell(data.phones[row][col * 2])) {
    return (
      <PhoneTableHalfCell
        type={data.type}
        phone={data.phones[row][col * 2]}
        addedPhones={addedPhones}
        addPhone={addPhone}
        colSpan={2}
      />
    );
  }

  return (
    <>
      {
        hasLeft
          ? <PhoneTableHalfCell
              type={data.type}
              phone={data.phones[row][col * 2]}
              addedPhones={addedPhones}
              addPhone={addPhone}
            />
          : <td>&nbsp;</td>
      }
      {
        hasRight
          ? <PhoneTableHalfCell
              type={data.type}
              phone={data.phones[row][col * 2 + 1]}
              addedPhones={addedPhones}
              addPhone={addPhone}
            />
          : <td>&nbsp;</td>
      }
    </>
  );
}

interface IPhonologyTable {
  data: IPhoneTableData;
  phones: IPhone[];
  dispatchPhones: Dispatch<IPhonesReducerAction>;
}

function PhonologyTable({ data, phones, dispatchPhones }: IPhonologyTable) {
  function addPhone(base: string) {
    const newPhone = {
      id: null, base, type: data.type, graph: "", qualities: [],
      isAllophone: false, allophoneOf: "", isForeign: false, notes: ""
    };
    dispatchPhones({ type: 'add', newPhone });
  }

  return (
    <PhoneTable>
      <tr>
        <th><b>{data.type === 'consonant' ? "Consonants" : "Vowels"}</b></th>
        {data.horizontal.map((label, i) => (
          <th key={i} colSpan={2}>{label}</th>
        ))}
      </tr>
      {data.vertical.map((label, i) => (
        <tr key={i}>
          <th>{label}</th>
          {data.horizontal.map((_, j) => (
            (data.phones[i][j * 2] || data.phones[i][j * 2 + 1])
              ? <PhoneTableCells
                  data={data}
                  addedPhones={phones}
                  addPhone={addPhone}
                  row={i}
                  col={j}
                  key={j}
                />
              : <td key={j} colSpan={2}>&nbsp;</td>
          ))}
        </tr>
      ))}
    </PhoneTable>
  );
}

interface IAllophoneSelect {
  phone: IPhone;
  allPhones: IPhone[];
  onChange: (value: string) => void;
}

function AllophoneSelect({ phone, allPhones, onChange }: IAllophoneSelect) {
  const options = allPhones.filter(phone => !phone.isAllophone).map(phoneToString);
  return (
    <select
      value={phone.allophoneOf}
      onChange={e => onChange(e.target.value)}
    >
      <option value=""></option>
      {phone.allophoneOf && !options.includes(phone.allophoneOf) && (
        <option value={phone.allophoneOf}>/{phone.allophoneOf}/</option>
      )}
      {options.map((phoneme, i) => options.indexOf(phoneme) === i && (
        <option key={i} value={phoneme}>/{phoneme}/</option>
      ))}
    </select>
  );
}

interface IPhoneListRow {
  phone: IPhone;
  allPhones: IPhone[];
  dispatchPhones: Dispatch<IPhonesReducerAction>;
}

function PhoneListRow({ phone, allPhones, dispatchPhones }: IPhoneListRow) {
  const qualities = phone.qualities.map(
    name => ({ value: name, label: name + " - " + qualityData.get(name) })
  ).sort((q1, q2) => q1.value.localeCompare(q2.value));

  function updateField(field: string, newValue: string | boolean | string[]) {
    dispatchPhones({ type: 'edit', phone, field, newValue });
  }

  function deletePhone() {
    dispatchPhones({ type: 'delete', phone });
  }

  return (
    <tr>
      <td>
        {
          phone.type === 'other'
            ? <input
                type="text"
                style={{ width: "3em", textAlign: "center" }}
                value={phone.base}
                onChange={e => updateField('base', e.target.value)}
              />
            : phoneToString(phone)
        }
      </td>
      <td>
        <input
          type="text"
          style={{ width: "3em" }}
          value={phone.graph}
          onChange={e => updateField('graph', e.target.value)}
        />
      </td>
      <td style={{ fontSize: "0.9em", textAlign: "left" }}>
        <ReactSelect
          isMulti
          value={qualities}
          options={[...qualityData.entries()].map(
            ([name, symbol]) => ({ value: name, label: name + " - " + symbol })
          )}
          isClearable={false}
          components={{
            IndicatorSeparator: () => null
          }}
          styles={{
            control: styles => ({ ...styles, minHeight: "unset", maxWidth: "15em", borderColor: "#767676" }),
            dropdownIndicator: styles => ({ ...styles, padding: "0" }),
            valueContainer: styles => ({ ...styles, padding: "0 2px" }),
            input: styles => ({
              ...styles, margin: "0", paddingBottom: "0", paddingTop: "0"
            }),
            option: styles => ({ ...styles, fontSize: "0.8rem", padding: "5px" }),
            menu: styles => ({ ...styles, top: "auto", bottom: "100%", width: "12em" }),
            multiValueLabel: styles => ({ ...styles, padding: "0", paddingLeft: "3px", paddingRight: "2px" }),
            multiValueRemove: styles => ({ ...styles, paddingLeft: "3px", paddingRight: "3px" })
          }}
          onChange={e => updateField('qualities', e.map(option => option.value).sort())}
        />
      </td>
      <td>
        <input
          type="checkbox"
          checked={phone.isAllophone}
          onChange={e => updateField('isAllophone', e.target.checked)}
        />
        {phone.isAllophone && (
          <>
            of{" "}
            <AllophoneSelect
              phone={phone}
              allPhones={allPhones}
              onChange={value => updateField('allophoneOf', value)}
            />
          </>
        )}
      </td>
      <td>
        <input
          type="checkbox"
          checked={phone.isForeign}
          onChange={e => updateField('isForeign', e.target.checked)}
        />
      </td>
      <td>
        <input
          type="text"
          style={{ width: "8em" }}
          value={phone.notes}
          onChange={e => updateField('notes', e.target.value)}
        />
      </td>
      <td>
        <LetterButtonXNoShadow onClick={deletePhone} />
      </td>
    </tr>
  );
}

interface IPhoneList {
  phones: IPhone[];
  dispatchPhones: Dispatch<IPhonesReducerAction>;
}

function PhoneList({ phones, dispatchPhones }: IPhoneList) {
  return (
    <div>
      <table className={styles.phoneListTable}>
        <tbody>
          <tr>
            <th>Phone</th>
            <th>Graph</th>
            <th>Qualities</th>
            <th>Allophone?</th>
            <th>Loanwords?</th>
            <th>Notes</th>
            <th>&nbsp;</th>
          </tr>
          {phones.map((phone, i) => (
            <PhoneListRow
              key={i}
              phone={phone}
              allPhones={phones}
              dispatchPhones={dispatchPhones}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getPhoneTableDataByType(type: PhoneType) {
  if(type === 'consonant') {
    return consonantData;
  } else if(type === 'vowel') {
    return vowelData;
  } else {
    return null;
  }
}

async function sendSavePhonesRequest(state: IPhonesReducerState, langId: string) {
  const reqBody = {
    new: state.phones.slice().reverse(),
    deleted: state.deleted
  };
  const res = await sendBackendJson(`languages/${langId}/phones`, 'PUT', reqBody);
  if(!res.ok) {
    throw res.body;
  }
  return res.body;
}

interface IPhonesReducerState {
  phones: IPhone[];
  deleted: string[];
  saved: boolean;
}

type IPhonesReducerAction = {
  type: 'add';
  newPhone: IPhone;
} | {
  type: 'edit';
  phone: IPhone;
  field: string;
  newValue: string | boolean | string[];
} | {
  type: 'delete';
  phone: IPhone;
} | {
  type: 'markSaved';
  newPhones: IPhone[];
};

function phonesReducer(state: IPhonesReducerState, action: IPhonesReducerAction) {
  const { phones, deleted } = state;
  switch(action.type) {
    case 'add':
      return { phones: [action.newPhone, ...phones], deleted, saved: false };

    case 'edit': {
      if(!(action.field in action.phone)) {
        throw new Error("Invalid field: " + action.field);
      }
      const index = phones.indexOf(action.phone);
      if(index < 0) {
        return state;
      }
      return {
        phones: [
          ...phones.slice(0, index),
          { ...phones[index], [action.field]: action.newValue },
          ...phones.slice(index + 1)
        ],
        deleted,
        saved: false
      };
    }

    case 'delete': {
      const newDeleted = action.phone.id === null ? deleted : [...deleted, action.phone.id];
      return {
        phones: phones.filter(phone => phone !== action.phone),
        deleted: newDeleted,
        saved: false
      };
    }

    case 'markSaved':
      return { phones: action.newPhones, deleted: [], saved: true };

    default:
      throw new Error("Unknown action type: " + (action as any).type);
  }
}

interface IEditPhonologyInner {
  language: ILanguage;
  defaultPhones: IPhone[];
}

function EditPhonologyInner({ language, defaultPhones }: IEditPhonologyInner) {
  const [currentType, setCurrentType] = useState<PhoneType>('consonant');
  const currentTableData = getPhoneTableDataByType(currentType);

  const [phonesState, dispatchPhones] = useReducer(phonesReducer, {
    phones: defaultPhones, deleted: [], saved: true
  });
  const { phones, saved: phonesAreSaved } = phonesState;

  const [isSavingPhones, setIsSavingPhones] = useState(false);

  useUnsavedPopup(!phonesAreSaved);

  function addOtherPhone() {
    const newPhone: IPhone = {
      id: null, base: "", type: 'other', graph: "", qualities: [],
      isAllophone: false, allophoneOf: "", isForeign: false, notes: ""
    };
    dispatchPhones({ type: 'add', newPhone });
  }

  return (
    <>
      <h2>Edit Phonology</h2>
      <p>
        Editing <Link to={'/language/' + language.id}>{language.name}</Link>'s phonology.
      </p>
      <label style={{ marginBottom: "1em", display: "block" }}>
        Adding:{" "}
        <select
          value={currentType}
          onChange={e => setCurrentType(e.target.value as PhoneType)}
        >
          <option value='consonant'>Consonants</option>
          <option value='vowel'>Vowels</option>
          <option value='other'>Other</option>
        </select>
      </label>
      {currentTableData && (
        <PhonologyTable
          data={currentTableData}
          phones={phones}
          dispatchPhones={dispatchPhones}
        />
      )}
      {currentType === 'other' && (
        <div>
          <button onClick={addOtherPhone}>+ Other Phone</button>
        </div>
      )}
      {!phonesAreSaved && (
        <SaveChangesButton
          isSaving={isSavingPhones}
          setIsSaving={setIsSavingPhones}
          saveQueryKey={['languages', language.id, 'phones', 'update']}
          saveQueryFn={async () => await sendSavePhonesRequest(phonesState, language.id)}
          handleSave={data => dispatchPhones({ type: 'markSaved', newPhones: data })}
          style={{ marginTop: "1.2em" }}
        >
          Save changes
        </SaveChangesButton>
      )}
      {
        phones.length > 0
          ? <PhoneList
              phones={phones}
              dispatchPhones={dispatchPhones}
            />
          : <p>You have not added any phones.</p>
      }
      {!phonesAreSaved && (
        <SaveChangesButton
          isSaving={isSavingPhones}
          setIsSaving={setIsSavingPhones}
          saveQueryKey={['languages', language.id, 'phones', 'update']}
          saveQueryFn={async () => await sendSavePhonesRequest(phonesState, language.id)}
          handleSave={data => dispatchPhones({ type: 'markSaved', newPhones: data })}
          style={phones.length > 0 ? { marginTop: "0.8em" } : undefined}
        >
          Save changes
        </SaveChangesButton>
      )}
    </>
  );
}

export default function EditPhonology() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(id);
  const phonesResponse = useLanguagePhones(id);

  useSetPageTitle("Edit Phonology");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(phonesResponse.status !== 'success') {
    return renderDatalessQueryResult(phonesResponse);
  }

  return (
    <EditPhonologyInner
      language={languageResponse.data}
      defaultPhones={phonesResponse.data}
    />
  );
}
