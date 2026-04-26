import { Link } from 'react-router-dom';

import { InfoParagraph } from '@/components/Paragraphs';

import { useLanguage } from '@/hooks/languages';
import { useLanguageHomonyms, usePartsOfSpeech } from '@/hooks/words';

import { ILanguage } from '@/types/languages';
import { IIdenticalWordOverview, IPartOfSpeech } from '@/types/words';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

import { formatPosFieldValue } from '@/utils/words';

interface IViewHomonymsInner {
  language: ILanguage;
  homonyms: IIdenticalWordOverview[][];
  partsOfSpeech: IPartOfSpeech[];
}

function ViewHomonymsInner({ language, homonyms, partsOfSpeech }: IViewHomonymsInner) {
  return (
    <>
      <h2>View Homonyms</h2>
      <InfoParagraph>
        Viewing all homonyms in{" "}
        <Link to={'/language/' + language.id}>{language.name}</Link>'s dictionary.
      </InfoParagraph>
      {homonyms.length === 0 && (
        <p>No homonyms were found.</p>
      )}
      <div style={{
        display: 'grid', gridTemplateColumns: '50% 50%', gap: '0 20px',
        width: '70%', margin: '0 auto', textAlign: 'left'
      }}>
        {homonyms.map((words, i) => (
          <ul key={i}>
            {words.map(word => (
              <li key={word.id}>
                <Link to={'/word/' + word.id}>{word.word}</Link>
                {" "}
                ({word.meaning}) [{formatPosFieldValue(word.pos, partsOfSpeech)}]
              </li>
            ))}
          </ul>
        ))}
      </div>
    </>
  );
}

export default function ViewHomonyms() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(id);
  const homonymsResponse = useLanguageHomonyms(id);
  const partsOfSpeechResponse = usePartsOfSpeech();

  useSetPageTitle("View Homonyms");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(homonymsResponse.status !== 'success') {
    return renderDatalessQueryResult(homonymsResponse);
  }

  if(partsOfSpeechResponse.status !== 'success') {
    return renderDatalessQueryResult(partsOfSpeechResponse);
  }

  return (
    <ViewHomonymsInner
      language={languageResponse.data}
      homonyms={homonymsResponse.data}
      partsOfSpeech={partsOfSpeechResponse.data}
    />
  );
}
