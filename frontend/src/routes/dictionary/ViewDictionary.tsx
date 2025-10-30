import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  DictionaryFilterSelect,
  DictionaryRow,
  DictionaryTable,
  EnableDictionaryFieldButtons
} from '@/components/Dictionary';
import { LetterButtonXNoShadow } from '@/components/LetterButtons';

import SelectedLanguageContext from '@/contexts/SelectedLanguageContext';

import { useLanguage, useLanguageDictionarySettings } from '@/hooks/languages';
import { useLanguageWords, usePartsOfSpeech } from '@/hooks/words';

import { IDictionarySettings, ILanguage } from '@/types/languages';
import {
  IDictionaryField,
  IDictionaryFilter,
  IPartOfSpeech,
  IWord
} from '@/types/words';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

import { sortAndFilterWords, userFacingFieldName } from '@/utils/words';

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
  const { selectedLanguage } = useContext(SelectedLanguageContext);

  const [fields, setFields] = useState<IDictionaryField[]>(getAllFields(dictSettings));

  const [filter, setFilter] = useState<IDictionaryFilter>({
    field: 'meaning', type: 'begins', value: "", matchCase: false,
    sortField: 'word', sortDir: 'asc'
  });

  const displayedFieldNames = fields.flatMap(f => f.isDisplaying ? [f.name] : []);

  const filteredWords = sortAndFilterWords(words, filter);

  function disableField(field: IDictionaryField) {
    const index = fields.indexOf(field);
    setFields(fields.with(index, { name: field.name, isDisplaying: false }));
  }

  return (
    <>
      <h2>View Dictionary</h2>
      <p style={{ marginBottom: "0.5em" }}>
        Viewing <Link to={'/language/' + language.id}>{language.name}</Link>'s dictionary.
      </p>
      {selectedLanguage && selectedLanguage.id !== language.id && (
        <p style={{ marginTop: "0" }}>
          <small>
            <Link to={`/add-word?deriveDict=${language.id}`}>
              [mass-derive into {selectedLanguage.name}]
            </Link>
          </small>
        </p>
      )}
      <p>
        More fields:
        <EnableDictionaryFieldButtons
          fields={fields}
          setFields={setFields}
        />
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
              <LetterButtonXNoShadow onClick={() => disableField(field)} />
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
