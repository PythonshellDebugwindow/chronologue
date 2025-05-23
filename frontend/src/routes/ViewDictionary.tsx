import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  DictionaryFilterSelect,
  DictionaryRow,
  DictionaryTable
} from '@/components/Dictionary';

import { useLanguage, useLanguageDictionarySettings } from '@/hooks/languages';
import { useLanguageWords, usePartsOfSpeech } from '@/hooks/words';

import { IDictionarySettings, ILanguage } from '@/types/languages';
import { IDictionaryFilter, IPartOfSpeech, IWord } from '@/types/words';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

import { sortAndFilterWords, userFacingFieldName } from '@/utils/words';

interface IDictionaryField {
  name: keyof IWord;
  isDisplaying: boolean;
}

function getAllFields(dictSettings: IDictionarySettings) {
  const all = ['meaning', 'ipa', 'pos', 'etymology', 'notes', 'created', 'updated'];
  if(!dictSettings.showWordIpa) {
    all.splice(all.indexOf('ipa'), 1);
  }
  const fields: IDictionaryField[] = [];
  for(const field of all) {
    fields.push({
      name: field as keyof IWord,
      isDisplaying: field === 'meaning' || field === 'pos'
    });
  }
  return fields;
}

interface IViewDictionaryInner {
  language: ILanguage;
  words: IWord[];
  dictSettings: IDictionarySettings;
  partsOfSpeech: IPartOfSpeech[];
}

function ViewDictionaryInner({ language, words, dictSettings, partsOfSpeech }: IViewDictionaryInner) {
  const [fields, setFields] = useState<IDictionaryField[]>(getAllFields(dictSettings));

  const [filter, setFilter] = useState<IDictionaryFilter>({
    field: 'meaning', type: 'begins', value: "", matchCase: false,
    sortField: 'word', sortDir: 'asc'
  });

  const displayedFieldNames = fields.flatMap(f => f.isDisplaying ? [f.name] : []);

  const filteredWords = sortAndFilterWords(words, filter);

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
      <p>
        Viewing <Link to={'/language/' + language.id}>{language.name}</Link>'s dictionary.
      </p>
      <p>
        More fields:
        {fields.map(field => !field.isDisplaying && (
          <button
            className="enable-dictionary-field-button"
            onClick={() => enableField(field)}
            key={field.name}
          >
            + {userFacingFieldName(field.name)}
          </button>
        ))}
      </p>
      <DictionaryFilterSelect
        fields={fields.map(f => f.name)}
        filter={filter}
        setFilter={setFilter}
      />
      <p>
        {filteredWords.length || "No"} word{filteredWords.length !== 1 && "s"} found.
      </p>
      <DictionaryTable>
        <tr>
          <th>Word</th>
          {fields.map(field => field.isDisplaying && (
            <th key={field.name}>
              {userFacingFieldName(field.name)}
              {field.name !== 'meaning' && (
                <button
                  className="letter-button letter-button-x"
                  onClick={() => disableField(field)}
                />
              )}
            </th>
          ))}
        </tr>
        {filteredWords.map(word => (
          <DictionaryRow
            word={word}
            fields={displayedFieldNames}
            language={language}
            partsOfSpeech={partsOfSpeech}
            key={word.id}
          />
        ))}
      </DictionaryTable>
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
  const dictSettingsResponse = useLanguageDictionarySettings(languageId);
  const posResponse = usePartsOfSpeech();

  const language = languageResponse.data;
  useSetPageTitle(language ? language.name + "'s Dictionary" : "Dictionary");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(dictResponse.status !== 'success') {
    return renderDatalessQueryResult(dictResponse);
  }

  if(dictSettingsResponse.status !== 'success') {
    return renderDatalessQueryResult(dictSettingsResponse);
  }

  if(posResponse.status !== 'success') {
    return renderDatalessQueryResult(posResponse);
  }

  return (
    <ViewDictionaryInner
      language={languageResponse.data}
      words={dictResponse.data}
      dictSettings={dictSettingsResponse.data}
      partsOfSpeech={posResponse.data}
    />
  );
}
