import { Dispatch, ReactNode, SetStateAction } from 'react';
import { Link } from 'react-router-dom';

import { ILanguage } from '@/types/languages';
import { IPartOfSpeech, IWord } from '@/types/words';

import {
  formatDictionaryFieldValue,
  formatPosAbbr,
  formatWordEtymology,
  userFacingFieldName
} from '@/utils/words';

type FilterField = Omit<keyof IWord, 'created' | 'updated'> | '';
type FilterType = 'begins' | 'contains' | 'ends' | 'exact' | 'regexp';

export interface IDictionaryFilter {
  field: FilterField;
  type: FilterType;
  value: string;
  matchCase: boolean;
  sortField: keyof IWord;
  sortDir: 'asc' | 'desc';
};

function filterWords(words: IWord[], filter: IDictionaryFilter) {
  if(!filter.field) {
    return words.slice();
  }

  let filterValue = filter.value;
  if(!filter.matchCase && filter.type !== 'regexp') {
    filterValue = filterValue.toLowerCase();
  }
  const regexp = (() => {
    if(filter.type !== 'regexp') {
      return null;
    }
    try {
      return new RegExp(filterValue, filter.matchCase ? "u" : "iu");
    } catch {
      return null;
    }
  })();

  return words.filter(word => {
    const rawFieldValue = word[filter.field as keyof IWord] as string;
    const fieldValue = filter.matchCase ? rawFieldValue : rawFieldValue.toLowerCase();
    switch(filter.type) {
      case 'begins':
        return fieldValue.startsWith(filterValue);
      case 'contains':
        return fieldValue.includes(filterValue);
      case 'ends':
        return fieldValue.endsWith(filterValue);
      case 'exact':
        return fieldValue === filterValue;
      case 'regexp':
        return regexp?.test(fieldValue);
      default:
        throw new TypeError("Invalid filter type: " + filter.type);
    }
  });
}

function sortWords(words: IWord[], filter: IDictionaryFilter) {
  const collator = new Intl.Collator();

  return words.sort((a, b) => {
    const aField = a[filter.sortField]!;
    const bField = b[filter.sortField]!;
    const sortDir = filter.sortDir === 'asc' ? 1 : -1;

    if(typeof aField === 'string' && typeof bField === 'string') {
      const lowComp = collator.compare(aField.toLowerCase(), bField.toLowerCase());
      return (lowComp || collator.compare(aField, bField)) * sortDir;
    }

    if(aField < bField) {
      return sortDir * -1;
    } else if(aField > bField) {
      return sortDir;
    } else {
      return 0;
    }
  });
}

export function sortAndFilterWords(words: IWord[], filter: IDictionaryFilter) {
  const filtered = filterWords(words, filter);
  return sortWords(filtered, filter);
};

interface IDictionaryFilterSelect {
  filter: IDictionaryFilter;
  setFilter: Dispatch<SetStateAction<IDictionaryFilter>>;
  fields: (keyof IWord)[];
  disabled?: boolean;
}

export function DictionaryFilterSelect(
  { filter, setFilter, fields, disabled = false }: IDictionaryFilterSelect
) {
  return (
    <>
      <p>
        Sort by:{" "}
        <select
          value={filter.sortField}
          onChange={e => setFilter({ ...filter, sortField: e.target.value as keyof IWord })}
          disabled={disabled}
        >
          <option value="word">Word</option>
          {
            fields.map(field => (
              <option value={field} key={field}>
                {field === 'pos' ? "POS" : userFacingFieldName(field)}
              </option>
            ))
          }
        </select>
        {" "}
        <select
          value={filter.sortDir}
          onChange={e => setFilter({ ...filter, sortDir: e.target.value as 'asc' | 'desc' })}
          disabled={disabled}
        >
          <option value="asc">ascending</option>
          <option value="desc">descending</option>
        </select>
      </p>
      <p>
        Filter by:{" "}
        <select
          value={filter.field as string}
          onChange={e => setFilter({ ...filter, field: e.target.value as FilterField })}
          disabled={disabled}
        >
          <option value="">None</option>
          <option value="word">Word</option>
          {
            fields.map(field => field !== 'created' && field !== 'updated' && (
              <option value={field} key={field}>
                {field === 'pos' ? "POS" : userFacingFieldName(field)}
              </option>
            ))
          }
        </select>
        {
          filter.field && <>
            {" "}
            <select
              value={filter.type}
              onChange={e => setFilter({ ...filter, type: e.target.value as FilterType })}
              disabled={disabled}
            >
              <option value='begins'>begins with</option>
              <option value='ends'>ends with</option>
              <option value='exact'>is exactly</option>
              <option value='contains'>contains</option>
              <option value='regexp'>matches regex</option>
            </select>
            {" "}
            <input
              value={filter.value}
              onChange={e => setFilter({ ...filter, value: e.target.value })}
              disabled={disabled}
              style={{ width: "7em" }}
            />
            {" "}
            (
            <label>
              <input
                checked={filter.matchCase}
                onChange={e => setFilter({ ...filter, matchCase: e.target.checked })}
                type="checkbox"
                disabled={disabled}
                style={{ position: "relative", top: "2px", marginLeft: "1px" }}
              />
              match case
            </label>
            )
          </>
        }
      </p>
    </>
  );
};

export function DictionaryTable({ children }: { children: ReactNode }) {
  return (
    <table className="dictionary-table" cellSpacing="0">
      <tbody>
        {children}
      </tbody>
    </table>
  );
};

interface IDictionaryRow<WordT> {
  word: WordT;
  fields: (keyof WordT)[];
  language: ILanguage;
  partsOfSpeech: IPartOfSpeech[];
  showLinkColumn?: boolean;
}

export function DictionaryRow<WordT extends Partial<IWord>>(
  { word, fields, language, partsOfSpeech, showLinkColumn = true }: IDictionaryRow<WordT>
) {
  function formatValue(field: keyof WordT) {
    switch(field) {
      case 'word':
        return (language.status === 'proto' ? "*" : "") + word.word;
      case 'pos':
        return formatPosAbbr(word.pos!, partsOfSpeech);
      case 'etymology':
        return formatWordEtymology(word.etymology!);
      default:
        return word[field] && formatDictionaryFieldValue(
          word as IWord, field as keyof IWord
        );
    }
  }

  return (
    <tr>
      {
        showLinkColumn && (
          <td>
            <Link to={'/word/' + word.id}>
              {formatValue('word')}
            </Link>
          </td>
        )
      }
      {
        fields.map((field, i) => (
          <td key={i}>
            {formatValue(field)}
          </td>
        ))
      }
    </tr>
  );
};
