import FamilyLink from '@/components/FamilyLink';
import LanguageLink from '@/components/LanguageLink';
import WordLink from '@/components/WordLink';

export function parseAtSignLinkMarkup(text: string) {
  const result = [];
  let oldIndex = 0;
  for(let i = text.indexOf("@"); i > -1; i = text.indexOf("@", i + 1)) {
    result.push(text.substring(oldIndex, i));

    if(text[i + 1] === "@") {
      result.push("@");
      ++i;
    } else if(/^\([0-9a-f]{32}\)/.test(text.substring(i + 2))) {
      const linkType = text[i + 1];
      const id = text.substring(i + 3, i + 3 + 32);
      switch(linkType) {
        case "D":
        case "W":
          result.push(<WordLink id={id} key={result.length} />);
          i += 3 + 32;
          break;
        case "F":
          result.push(<FamilyLink id={id} key={result.length} />);
          i += 3 + 32;
          break;
        case "L":
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
  result.push(text.substring(oldIndex));
  return result;
}
