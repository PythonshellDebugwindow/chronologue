import DisplayDate from '@/components/DisplayDate';

import { IDictionaryFilter, IPartOfSpeech, IWord, IWordClassNoPOS } from '@/types/words';

import { parseAtSignLinkMarkup } from './global/markup';

export function formatDictionaryFieldValue(word: IWord, field: keyof IWord) {
  const value = word[field];
  if(field === 'ipa') {
    return "[" + value + "]";
  } else if(value instanceof Date) {
    return <DisplayDate date={value} />;
  } else {
    return value;
  }
}

export function formatPosAbbr(code: string, partsOfSpeech: IPartOfSpeech[]) {
  const pos = partsOfSpeech.find(pos => pos.code === code);
  const posName = pos ? pos.name : "unknown code";
  return <abbr title={posName}>{code}</abbr>;
}

export function formatPosFieldValue(posCode: string, partsOfSpeech: IPartOfSpeech[]) {
  const pos = partsOfSpeech.find(pos => pos.code === posCode);
  return pos ? pos.name : `unknown (${posCode})`;
}

export function formatWordClasses(classes: IWordClassNoPOS[]) {
  return (
    <ul style={{ listStyle: "none", margin: "0", padding: "0" }}>
      {classes.map(cls => (
        <li key={cls.code}>
          [{cls.code}] {cls.name}
        </li>
      ))}
    </ul>
  );
}

export function formatWordEtymology(etymology: string) {
  return parseAtSignLinkMarkup(etymology);
}

export function userFacingFieldName(field: string) {
  if(field === 'pos') {
    return <abbr title="part of speech">POS</abbr>;
  } else if(field === 'ipa') {
    return "IPA";
  } else {
    return field[0].toUpperCase() + field.substring(1);
  }
}

function filterWords<WordT extends Partial<IWord>>(words: WordT[], filter: IDictionaryFilter) {
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
    const rawFieldValue = word[filter.field as keyof WordT] as string;
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

function sortWords<WordT extends Partial<IWord>>(words: WordT[], filter: IDictionaryFilter) {
  const collator = new Intl.Collator();

  words.sort((a, b) => {
    const aField = a[filter.sortField]!;
    const bField = b[filter.sortField]!;

    if(typeof aField === 'string' && typeof bField === 'string') {
      const lowComp = collator.compare(aField.toLowerCase(), bField.toLowerCase());
      return lowComp || collator.compare(aField, bField);
    }

    if(aField < bField) {
      return -1;
    } else if(aField > bField) {
      return 1;
    } else {
      return 0;
    }
  });

  if(filter.sortDir === 'desc') {
    // The creation order of words which were imported at the same time can only be discerned from
    // their initial order in the array; sorting in reverse would disrupt this order, so reverse
    // the words after sorting instead
    words.reverse();
  }

  return words;
}

export function sortAndFilterWords<WordT extends Partial<IWord>>(
  words: WordT[], filter: IDictionaryFilter
) {
  const filtered = filterWords(words, filter);
  return sortWords(filtered, filter);
}
