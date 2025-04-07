import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useLanguage, ILanguage } from '../languageData.tsx';
import {
  renderDatalessQueryResult, useGetParamsOrSelectedId, useSetPageTitle
} from '../utils.tsx';
import {
  formatDictionaryFieldValue, formatWordEtymology, usePartsOfSpeech,
  useLanguageWords, userFacingFieldName, IPartOfSpeech, IWord
} from '../wordData.tsx';

function formatPosFieldValue(word: IWord, partsOfSpeech: IPartOfSpeech[]) {
  const pos = partsOfSpeech.find(pos => pos.code === word.pos);
  const posName = pos ? pos.name : "unknown code";
  return <abbr title={posName}>{ word.pos }</abbr>;
}

interface IDictionaryField {
  name: keyof IWord;
  isDisplaying: boolean;
}

interface IWordRow {
  word: IWord;
  fields: IDictionaryField[];
  language: ILanguage;
  partsOfSpeech: IPartOfSpeech[];
}

function WordRow({ word, fields, language, partsOfSpeech }: IWordRow) {
  function formatValue(field: IDictionaryField) {
    switch(field.name) {
      case 'pos':
        return formatPosFieldValue(word, partsOfSpeech);
      case 'etymology':
        return formatWordEtymology(word.etymology);
      default:
        return word[field.name] && formatDictionaryFieldValue(word, field.name);
    }
  }

  return (
    <tr>
      <td>
        <Link to={ '/word/' + word.id }>
          { (language.status === 'proto' ? "*" : "") + word.word }
        </Link>
      </td>
      {
        fields.map(
          field => field.isDisplaying && (
            <td key={ field.name }>
              { formatValue(field) }
            </td>
          )
        )
      }
    </tr>
  )
};

function getAllFields() {
  const fields: IDictionaryField[] = [];
  for(const field of ['meaning', 'ipa', 'pos', 'etymology', 'notes', 'created', 'updated']) {
    fields.push({
      name: field as keyof IWord,
      isDisplaying: field === 'meaning' || field === 'pos'
    });
  }
  return fields;
}

type FilterField = Omit<keyof IWord, 'created' | 'updated'> | "";
type FilterType = 'begins' | 'contains' | 'ends' | 'exact' | 'regexp';

function filterWords(
  words: IWord[], field: FilterField, type: FilterType,
  filterValue: string, matchCase: boolean
) {
  if(!field) {
    return words.slice();
  }

  if(matchCase && type !== 'regexp') {
    filterValue = filterValue.toLowerCase();
  }
  const regexp = (() => {
    if(type !== 'regexp') {
      return null;
    }
    try {
      return new RegExp(filterValue, matchCase ? "u" : "iu");
    } catch {
      return null;
    }
  })();

  return words.filter(word => {
    const rawFieldValue = word[field as keyof IWord] as string;
    const fieldValue = matchCase ? rawFieldValue : rawFieldValue.toLowerCase();
    switch(type) {
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
        throw new TypeError("Invalid filter type: " + type);
    }
  });
}

interface IViewDictionaryInner {
  language: ILanguage;
  words: IWord[];
  partsOfSpeech: IPartOfSpeech[];
}

function ViewDictionaryInner({ language, words, partsOfSpeech }: IViewDictionaryInner) {
  const [fields, setFields] = useState<IDictionaryField[]>(getAllFields());

  const [sortField, setSortField] = useState<keyof IWord>('word');
  const [sortDesc, setSortDesc] = useState(false);

  const [filterField, setFilterField] = useState<FilterField>("");
  const [filterType, setFilterType] = useState<FilterType>('begins');
  const [filterValue, setFilterValue] = useState("");
  const [filterMatchCase, setFilterMatchCase] = useState(false);

  const collator = new Intl.Collator();

  const sortedWords = filterWords(
    words, filterField, filterType, filterValue, filterMatchCase
  );
  sortedWords.sort((a, b) => {
    const aField = a[sortField]!;
    const bField = b[sortField]!;
    
    if(typeof aField === 'string' && typeof bField === 'string') {
      const lowComp = collator.compare(aField.toLowerCase(), bField.toLowerCase());
      return (lowComp || collator.compare(aField, bField)) * (sortDesc ? -1 : 1);
    }
    
    if(aField < bField) {
      return sortDesc ? 1 : -1;
    } else if(aField > bField) {
      return sortDesc ? -1 : 1;
    } else {
      return 0;
    }
  });
  
  function enableField(field: IDictionaryField) {
    const index = fields.indexOf(field);
    setFields(fields.with(index, { name: field.name, isDisplaying: true }));
  }
  
  function disableField(field: IDictionaryField) {
    const index = fields.indexOf(field);
    setFields(fields.with(index, { name: field.name, isDisplaying: false }));
  }

  return (
    <>
      <h2>View Dictionary</h2>
      <p>Viewing <Link to={ '/language/' + language.id }>{ language.name }</Link>'s dictionary.</p>
      <p>
        More fields:
        {
          fields.map(field => (
            !field.isDisplaying && (
              <button
                className="enable-dictionary-field-button"
                onClick={ () => enableField(field) }
                key={field.name}
              >
                + { userFacingFieldName(field.name) }
              </button>
            )
          ))
        }
      </p>
      <p>
        Sort by:{" "}
        <select
          value={sortField}
          onChange={ e => setSortField(e.target.value as keyof IWord) }
        >
          <option value="word">Word</option>
          {
            fields.map(field => (
              <option
                value={field.name}
                key={field.name}
              >
                { field.name === 'pos' ? "POS" : userFacingFieldName(field.name) }
              </option>
            ))
          }
        </select>
        {" "}
        <select
          value={ sortDesc ? 'desc' : 'asc' }
          onChange={ e => setSortDesc(e.target.value === 'desc') }
        >
          <option value="asc">ascending</option>
          <option value="desc">descending</option>
        </select>
      </p>
      <p>
        Filter by:{" "}
        <select
          value={ filterField as keyof IWord }
          onChange={ e => setFilterField(e.target.value as FilterField) }
        >
          <option value="">None</option>
          <option value="word">Word</option>
          {
            fields.map(field => field.name !== 'created' && field.name !== 'updated' && (
              <option value={field.name} key={field.name}>
                { field.name === 'pos' ? "POS" : userFacingFieldName(field.name) }
              </option>
            ))
          }
        </select>
        {
          filterField && <>
            {" "}
            <select
              value={filterType}
              onChange={ e => setFilterType(e.target.value as FilterType) }
            >
              <option value='begins'>begins with</option>
              <option value='ends'>ends with</option>
              <option value='exact'>is exactly</option>
              <option value='contains'>contains</option>
              <option value='regexp'>matches regex</option>
            </select>
            {" "}
            <input
              value={filterValue}
              onChange={ e => setFilterValue(e.target.value) }
              style={{ width: "7em" }}
            />
            {" "}
            (
              <label>
                <input
                  checked={filterMatchCase}
                  onChange={ e => setFilterMatchCase(e.target.checked) }
                  type="checkbox"
                  style={{ position: "relative", top: "2px", marginLeft: "1px" }}
                />
                match case
              </label>
            )
          </>
        }
      </p>
      <p>
        { sortedWords.length || "No" } word{ sortedWords.length !== 1 && "s" } found.
      </p>
      <table className="dictionary-table" cellSpacing="0">
        <tbody>
          <tr>
            <th>Word</th>
            {
              fields.map(
                field => field.isDisplaying && (
                  <th key={field.name}>
                    { userFacingFieldName(field.name) }
                    {
                      field.name !== 'meaning' && (
                        <button
                          className="letter-button letter-button-x"
                          onClick={ () => disableField(field) }
                        />
                      )
                    }
                  </th>
                )
              )
            }
          </tr>
          {
            sortedWords.map(word => (
              <WordRow
                word={word}
                fields={fields}
                language={language}
                partsOfSpeech={partsOfSpeech}
                key={ word.id }
              />
            ))
          }
        </tbody>
      </table>
    </>
  );
}

export default function ViewDictionary() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);
  const dictResponse = useLanguageWords(languageId);
  const posResponse = usePartsOfSpeech();
  
  const language = languageResponse.data;
  useSetPageTitle(language ? language.name + "'s Dictionary" : "Dictionary");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(dictResponse.status !== 'success') {
    return renderDatalessQueryResult(dictResponse);
  }

  if(posResponse.status !== 'success') {
    return renderDatalessQueryResult(posResponse);
  }

  return (
    <ViewDictionaryInner
      language={ languageResponse.data }
      words={ dictResponse.data }
      partsOfSpeech={ posResponse.data }
    />
  );
};
