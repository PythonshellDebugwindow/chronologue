import { Dispatch, ReactNode, SetStateAction } from 'react';
import { Link } from 'react-router-dom';

import { ILanguage } from '@/types/languages';
import {
  DictionaryFilterField,
  DictionaryFilterType,
  IDictionaryFilter,
  IPartOfSpeech,
  IWord
} from '@/types/words';

import {
  formatDictionaryFieldValue,
  formatPosAbbr,
  formatWordEtymology,
  userFacingFieldName
} from '@/utils/words';

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
          onChange={e => {
            setFilter({ ...filter, sortField: e.target.value as keyof IWord });
          }}
          disabled={disabled}
        >
          <option value="word">Word</option>
          {fields.map(field => (
            <option value={field} key={field}>
              {field === 'pos' ? "POS" : userFacingFieldName(field)}
            </option>
          ))}
        </select>
        {" "}
        <select
          value={filter.sortDir}
          onChange={e => {
            setFilter({ ...filter, sortDir: e.target.value as 'asc' | 'desc' });
          }}
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
          onChange={e => {
            setFilter({ ...filter, field: e.target.value as DictionaryFilterField });
          }}
          disabled={disabled}
        >
          <option value="">None</option>
          <option value="word">Word</option>
          {fields.map(field => field !== 'created' && field !== 'updated' && (
            <option value={field} key={field}>
              {field === 'pos' ? "POS" : userFacingFieldName(field)}
            </option>
          ))}
        </select>
        {filter.field && (
          <>
            {" "}
            <select
              value={filter.type}
              onChange={e => {
                setFilter({ ...filter, type: e.target.value as DictionaryFilterType });
              }}
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
        )}
      </p>
    </>
  );
}

export function DictionaryTable({ children }: { children: ReactNode }) {
  return (
    <table className="dictionary-table" cellSpacing="0">
      <tbody>
        {children}
      </tbody>
    </table>
  );
}

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
      {showLinkColumn && (
        <td>
          <Link to={'/word/' + word.id}>
            {formatValue('word')}
          </Link>
        </td>
      )}
      {fields.map((field, i) => (
        <td key={i}>
          {formatValue(field)}
        </td>
      ))}
    </tr>
  );
}
