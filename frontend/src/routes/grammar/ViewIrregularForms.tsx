import { useState } from 'react';
import { Link } from 'react-router-dom';

import { DictionaryTable } from '@/components/Dictionary';

import { useGrammarForms, useLanguageIrregularForms } from '@/hooks/grammar';
import { useLanguage } from '@/hooks/languages';
import { usePartsOfSpeech } from '@/hooks/words';

import { IGrammarForm, IWordIrregularForm } from '@/types/grammar';
import { ILanguage } from '@/types/languages';
import { IPartOfSpeech } from '@/types/words';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

import { formatPeriodSeparatedGrammarForms } from '@/utils/grammar';
import { formatPosFieldValue } from '@/utils/words';

function sortIrregularForms(forms: IWordIrregularForm[], sortField: 'form' | 'pos' | 'word') {
  const collator = new Intl.Collator();
  return forms.toSorted((a, b) => {
    if(sortField === 'form') {
      if(a.form !== b.form) {
        return collator.compare(a.form, b.form);
      }
    } else if(sortField === 'pos') {
      const result = collator.compare(a.tablePos, b.tablePos);
      if(result !== 0) {
        return result;
      } else if(a.tableName !== b.tableName) {
        return collator.compare(a.tableName, b.tableName);
      } else if(a.tableId !== b.tableId) {
        return collator.compare(a.tableId, b.tableId);
      }
    }
    return collator.compare(a.word, b.word) || collator.compare(a.wordId, b.wordId);
  });
}

interface IViewDictionaryInner {
  language: ILanguage;
  forms: IWordIrregularForm[];
  grammarForms: IGrammarForm[];
  partsOfSpeech: IPartOfSpeech[];
}

function ViewIrregularFormsInner({ language, forms, grammarForms, partsOfSpeech }: IViewDictionaryInner) {
  const [sortField, setSortField] = useState<'form' | 'pos' | 'word'>('form');

  const sortedForms = sortIrregularForms(forms, sortField);

  return (
    <>
      <h2>View Irregular Forms</h2>
      <p style={{ marginBottom: "0.5em" }}>
        Viewing all irregular forms in{" "}
        <Link to={'/language/' + language.id}>{language.name}</Link>'s dictionary.
      </p>
      <p>
        Sort by:{" "}
        <select
          value={sortField}
          onChange={e => setSortField(e.target.value as 'form' | 'pos' | 'word')}
        >
          <option value="form">Form</option>
          <option value="word">Word</option>
          <option value="pos">Part of speech</option>
        </select>
      </p>
      <p>
        {forms.length || "No"} form{forms.length !== 1 && "s"} found.
      </p>
      <DictionaryTable>
        <tr>
          <th>Table</th>
          <th>Word</th>
          <th>Row</th>
          <th>Column</th>
          <th>Form</th>
          <th>Link</th>
        </tr>
        {sortedForms.map((form, i) => (
          <tr key={i}>
            <td>
              <Link to={'/grammar-table/' + form.tableId}>
                {form.tableName && form.tableName + " "}
                [{formatPosFieldValue(form.tablePos, partsOfSpeech)}]
              </Link>
            </td>
            <td>
              <Link to={'/word/' + form.wordId}>
                {language.status === 'proto' && "*"}
                {form.word}
              </Link>
            </td>
            <td>{formatPeriodSeparatedGrammarForms(form.rowName, grammarForms)}</td>
            <td>{formatPeriodSeparatedGrammarForms(form.columnName, grammarForms)}</td>
            <td>{form.form}</td>
            <td>
              <Link to={`/irregular-forms/${form.tableId}?word=${form.wordId}`}>
                <small>
                  [edit]
                </small>
              </Link>
            </td>
          </tr>
        ))}
      </DictionaryTable>
    </>
  );
}

export default function ViewIrregularForms() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);
  const formsResponse = useLanguageIrregularForms(languageId);
  const grammarFormsResponse = useGrammarForms();
  const posResponse = usePartsOfSpeech();

  const language = languageResponse.data;
  useSetPageTitle(language ? language.name + "'s Irregular Forms" : "Irregular Forms");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(formsResponse.status !== 'success') {
    return renderDatalessQueryResult(formsResponse);
  }

  if(grammarFormsResponse.status !== 'success') {
    return renderDatalessQueryResult(grammarFormsResponse);
  }

  if(posResponse.status !== 'success') {
    return renderDatalessQueryResult(posResponse);
  }

  return (
    <ViewIrregularFormsInner
      language={languageResponse.data}
      forms={formsResponse.data}
      grammarForms={grammarFormsResponse.data}
      partsOfSpeech={posResponse.data}
    />
  );
}
