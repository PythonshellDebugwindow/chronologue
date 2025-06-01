import { ReactNode } from 'react';

import { UserNotesParagraph } from '../Paragraphs';
import { PhoneTable, PhoneTableCell } from '../PhoneTable';

import { useLanguagePhones } from '@/hooks/phones';

import { IPhone, IPhoneTableData } from '@/types/phones';

import { renderDatalessQueryResult } from '@/utils/global/queries';
import {
  consonantData,
  formatPhoneForPhonologyTable,
  hasDoubleWidthCell,
  vowelData
} from '@/utils/phones';

import styles from './ViewLanguagePhonology.module.css';

interface IPhoneWithFormatted {
  phone: IPhone;
  formatted: string;
}

interface IPhoneTableHalfCell {
  phone: string;
  addedPhones: IPhoneWithFormatted[];
  phonesWithNotes: IPhone[];
  colSpan?: number;
}

function PhoneTableHalfCell({ phone, addedPhones, phonesWithNotes, colSpan = 1 }: IPhoneTableHalfCell) {
  const matchingPhones = addedPhones.filter(f => f.phone.base === phone);
  const seenWithoutNotes: string[] = [];
  const withNotes = matchingPhones.flatMap(({ phone, formatted }, i) => {
    if(!phone.notes && seenWithoutNotes.includes(formatted)) {
      return [];
    }
    const res: ReactNode[] = [formatted];
    if(i > 0) {
      res.unshift(" \u00A0");
    }
    if(phone.notes) {
      res.push(<sup key={i}>{phonesWithNotes.indexOf(phone) + 1}</sup>);
    } else {
      seenWithoutNotes.push(formatted);
    }
    return res;
  });

  return (
    <PhoneTableCell colSpan={colSpan}>
      &nbsp;
      {withNotes}
      &nbsp;
    </PhoneTableCell>
  );
}

interface IPhoneTableCells {
  data: IPhoneTableData;
  phones: IPhoneWithFormatted[];
  phonesWithNotes: IPhone[];
  phoneBases: string[];
  row: number;
  col: number;
}

function PhoneTableCells({ data, phones, phonesWithNotes, phoneBases, row, col }: IPhoneTableCells) {
  const hasLeft = phoneBases.includes(data.phones[row][col * 2]);
  const hasRight = phoneBases.includes(data.phones[row][col * 2 + 1]);
  if(!hasLeft && !hasRight) {
    return <td colSpan={2}>&nbsp;</td>;
  }

  if(hasDoubleWidthCell(data.phones[row][col * 2])) {
    return (
      <PhoneTableHalfCell
        phone={data.phones[row][col * 2]}
        addedPhones={phones}
        phonesWithNotes={phonesWithNotes}
        colSpan={2}
      />
    );
  }

  return (
    <>
      {
        hasLeft
          ? <PhoneTableHalfCell
              phone={data.phones[row][col * 2]}
              addedPhones={phones}
              phonesWithNotes={phonesWithNotes}
            />
          : <td>&nbsp;</td>
      }
      {
        hasRight
          ? <PhoneTableHalfCell
              phone={data.phones[row][col * 2 + 1]}
              addedPhones={phones}
              phonesWithNotes={phonesWithNotes}
            />
          : <td>&nbsp;</td>
      }
    </>
  );
}

interface IPhonologyTable {
  data: IPhoneTableData;
  phones: IPhone[];
  marginTop?: string;
}

function PhonologyTable({ data, phones, marginTop = "" }: IPhonologyTable) {
  if(!phones.some(p => p.type === data.type)) {
    return null;
  }

  const phoneBases = phones.filter(p => p.type === data.type).map(p => p.base);
  const columnIndices: number[] = [];
  for(let col = 0; col < data.horizontal.length; ++col) {
    for(let row = 0; row < data.vertical.length; ++row) {
      const left = data.phones[row][col * 2];
      const right = data.phones[row][col * 2 + 1];
      if(phoneBases.includes(left) || phoneBases.includes(right)) {
        columnIndices.push(col);
        break;
      }
    }
  }

  const phonesWithFormatting = phones.flatMap(phone => (
    phone.type === data.type
      ? [{ phone, formatted: formatPhoneForPhonologyTable(phone) }]
      : []
  ));
  phonesWithFormatting.sort((p1, p2) => {
    const firstIsBracketed = p1.formatted[0] === "[" || p1.formatted[0] === "(";
    const secondIsBracketed = p2.formatted[0] === "[" || p2.formatted[0] === "(";
    if(!firstIsBracketed && secondIsBracketed) {
      return -1;
    } else if(firstIsBracketed && !secondIsBracketed) {
      return 1;
    } else if(p1.formatted !== p2.formatted) {
      return p1.formatted.localeCompare(p2.formatted);
    } else {
      return p1.phone.notes.localeCompare(p2.phone.notes);
    }
  });

  const phonesWithNotes = phonesWithFormatting.flatMap(
    ({ phone }) => phone.notes ? [phone] : []
  );
  phonesWithNotes.sort((p1, p2) => {
    const p1Row = data.phones.findIndex(row => row.includes(p1.base));
    const p2Row = data.phones.findIndex(row => row.includes(p2.base));
    if(p1Row !== p2Row) {
      return p1Row - p2Row;
    } else {
      const p1Col = data.phones[p1Row].indexOf(p1.base);
      const p2Col = data.phones[p2Row].indexOf(p2.base);
      return p1Col - p2Col;
    }
  });

  return (
    <>
      <PhoneTable style={marginTop ? { marginTop } : undefined}>
        <tr>
          <th><b>{data.type === 'consonant' ? "Consonants" : "Vowels"}</b></th>
          {columnIndices.map(i => (
            <th key={i} colSpan={2}>{data.horizontal[i]}</th>
          ))}
        </tr>
        {data.vertical.map((label, i) => (
          phoneBases.some(b => data.phones[i].includes(b)) && (
            <tr key={i}>
              <th>{label}</th>
              {columnIndices.map(j => (
                <PhoneTableCells
                  data={data}
                  phones={phonesWithFormatting}
                  phonesWithNotes={phonesWithNotes}
                  phoneBases={phoneBases}
                  row={i}
                  col={j}
                  key={j}
                />
              ))}
            </tr>
          )
        ))}
      </PhoneTable>
      {phonesWithNotes.length > 0 && (
        <ol className={styles.phoneNotesList}>
          {phonesWithNotes.map((phone, i) => <li key={i}>{phone.notes}</li>)}
        </ol>
      )}
    </>
  );
}

function compareOtherPhoneChars(p1Char: string, p2Char: string) {
  const p1ConsRow = consonantData.phones.findIndex(row => row.includes(p1Char));
  const p2ConsRow = consonantData.phones.findIndex(row => row.includes(p2Char));
  if(p1ConsRow >= 0 && p2ConsRow >= 0) {
    if(p1ConsRow !== p2ConsRow) {
      return p1ConsRow - p2ConsRow;
    } else {
      const p1ConsCol = consonantData.phones[p1ConsRow].indexOf(p1Char);
      const p2ConsCol = consonantData.phones[p2ConsRow].indexOf(p2Char);
      return p1ConsCol - p2ConsCol;
    }
  }
  const p1VowelRow = vowelData.phones.findIndex(row => row.includes(p1Char));
  const p2VowelRow = vowelData.phones.findIndex(row => row.includes(p2Char));
  if(p1VowelRow >= 0 && p2VowelRow >= 0) {
    if(p1VowelRow !== p2VowelRow) {
      return p1VowelRow - p2VowelRow;
    } else {
      const p1VowelCol = vowelData.phones[p1VowelRow].indexOf(p1Char);
      const p2VowelCol = vowelData.phones[p2VowelRow].indexOf(p2Char);
      return p1VowelCol - p2VowelCol;
    }
  }
  if(p1ConsRow >= 0 && p2VowelRow >= 0) {
    return -1;
  } else if(p1VowelRow >= 0 && p2ConsRow >= 0) {
    return 1;
  } else if(p1ConsRow >= 0 || p1VowelRow >= 0) {
    return -1;
  } else if(p2ConsRow >= 0 || p2VowelRow >= 0) {
    return 1;
  } else {
    return p1Char.localeCompare(p2Char);
  }
}

function compareOtherPhones(p1: IPhone, p2: IPhone) {
  for(let i = 0; i < p1.base.length && i < p2.base.length; ++i) {
    const comp = compareOtherPhoneChars(p1.base[i], p2.base[i]);
    if(comp !== 0) {
      return comp;
    }
  }
  if(p1.base.length !== p2.base.length) {
    return p1.base.length - p2.base.length;
  }
  return p1.notes.localeCompare(p2.notes);
}

function OtherPhonesTable({ phones }: { phones: IPhone[] }) {
  const otherPhones = phones.filter(p => p.type === 'other');
  if(otherPhones.length === 0) {
    return null;
  }

  otherPhones.sort(compareOtherPhones);

  const phoneRows = [];
  const phonesWithNotes = otherPhones.filter(phone => phone.notes);
  for(let i = 0; i < otherPhones.length; i += 10) {
    phoneRows.push(otherPhones.slice(i, i + 10).map((phone, i) => (
      <PhoneTableCell key={i}>
        {phone.base}
        {phone.notes && <sup>{phonesWithNotes.indexOf(phone) + 1}</sup>}
      </PhoneTableCell>
    )));
  }

  return (
    <>
      <PhoneTable style={{ border: "1px solid #999", marginTop: "15px" }}>
        <tr>
          <th rowSpan={phoneRows.length}><b>Other</b></th>
          {phoneRows[0]}
        </tr>
        {phoneRows.slice(1).map((row, i) => <tr key={i}>{row}</tr>)}
      </PhoneTable>
      {phonesWithNotes.length > 0 && (
        <ol className={styles.phoneNotesList}>
          {phonesWithNotes.map((phone, i) => <li key={i}>{phone.notes}</li>)}
        </ol>
      )}
    </>
  );
}

export function PhonologySection({ languageId, notes }: { languageId: string, notes: string }) {
  const phonesResponse = useLanguagePhones(languageId);

  if(phonesResponse.status !== 'success') {
    return renderDatalessQueryResult(phonesResponse);
  }

  if(phonesResponse.data.length === 0 && !notes) {
    return null;
  }

  return (
    <>
      <h3>Phonology</h3>
      {phonesResponse.data.length > 0 && (
        <>
          <PhonologyTable
            data={consonantData}
            phones={phonesResponse.data}
            marginTop="10px"
          />
          <PhonologyTable
            data={vowelData}
            phones={phonesResponse.data}
            marginTop="15px"
          />
          <OtherPhonesTable
            phones={phonesResponse.data}
          />
        </>
      )}
      {notes && (
        <>
          <h4>Notes</h4>
          <UserNotesParagraph marginTop="0">{notes}</UserNotesParagraph>
        </>
      )}
    </>
  );
}
