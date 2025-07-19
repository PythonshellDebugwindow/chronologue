import { Link } from 'react-router-dom';

import FamilyLink from '@/components/FamilyLink';
import LanguageLink from '@/components/LanguageLink';
import WordLink from '@/components/WordLink';

import { useWordOverviewWithLanguage } from '@/hooks/words';

function LanguageAndWordLink({ wordId }: { wordId: string }) {
  const { status, error, data: overview } = useWordOverviewWithLanguage(wordId);
  if(status === 'pending') {
    return <Link to={'/word/' + wordId}>Loading...</Link>;
  } else if(status === 'error') {
    return <Link to={'/word/' + wordId}>Error: {error.message}</Link>;
  }

  return (
    <>
      <Link to={'/language/' + overview.langId}>{overview.langName}</Link>
      {" "}
      <i>
        <Link to={'/word/' + wordId}>
          {overview.langStatus === 'proto' && "*"}
          {overview.word}
        </Link>
      </i>
    </>
  );
}

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
        case "B":
        case "D":
        case "W":
          result.push(<LanguageAndWordLink wordId={id} key={result.length} />);
          i += 3 + 32;
          break;
        case "b":
        case "d":
        case "w":
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
