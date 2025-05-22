import DisplayDate from '../components/DisplayDate.tsx';
import LanguageLink from '../components/LanguageLink.tsx';
import WordLink from '../components/WordLink.tsx';

import { IPartOfSpeech, IWord, IWordClassNoPOS } from '@/types/words';

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
  const result = [];
  let i = etymology.indexOf("@");
  let oldIndex = 0;
  for(; i > -1; i = etymology.indexOf("@", i + 1)) {
    result.push(etymology.substring(oldIndex, i));

    if(etymology[i + 1] === "@") {
      result.push("@");
      ++i;
    } else if(/^\([0-9a-f]{32}\)/.test(etymology.substring(i + 2))) {
      const linkType = etymology[i + 1];
      const id = etymology.substring(i + 3, i + 3 + 32);
      switch(linkType) {
        case "d":
        case "w":
          result.push(<WordLink id={id} key={result.length} />);
          i += 3 + 32;
          break;
        case "l":
          result.push(<LanguageLink id={id} key={result.length} />);
          i += 3 + 32;
          break;
        default:
          result.push("@");
      }
    } else {
      result.push("@");
    }

    oldIndex = i + 1;
  }
  result.push(etymology.substring(oldIndex));
  return result;
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
