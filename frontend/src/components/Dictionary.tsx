import { Link } from 'react-router-dom';

import { ILanguage } from '../languageData.tsx';
import {
  IPartOfSpeech, IWord, formatDictionaryFieldValue, formatPosAbbr, formatWordEtymology
} from '../wordData.tsx';
import { ReactNode } from 'react';

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
            <Link to={ '/word/' + word.id }>
              { formatValue('word') }
            </Link>
          </td>
        )
      }
      {
        fields.map((field, i) => (
          <td key={i}>
            { formatValue(field) }
          </td>
        ))
      }
    </tr>
  );
};
