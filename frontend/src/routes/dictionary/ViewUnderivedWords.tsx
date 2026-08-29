import { useState } from 'react';
import { Link } from 'react-router';

import { InfoParagraph } from '@/components/Paragraphs';

import { useLanguage } from '@/hooks/languages';
import { useLanguageUnderivedWords } from '@/hooks/words';

import { ILanguage } from '@/types/languages';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

function ViewUnderivedWordsInner({ language }: { language: ILanguage }) {
  const [maximum, setMaximum] = useState(0);

  const { isPending, error, data: words } = useLanguageUnderivedWords(language.id, maximum);

  return (
    <>
      <h2>View Underived Words</h2>
      <InfoParagraph>
        Viewing all words in <Link to={'/language/' + language.id}>{language.name}</Link>'s
        {" "}dictionary without any descendants or derived terms in any languages. This can be
        useful for finding unused <span style={{ whiteSpace: "nowrap" }}>proto-language</span>
        {" "}roots.
      </InfoParagraph>
      <ul style={{ listStyle: "none", padding: "0" }}>
        <li>
          <label>
            <input
              type="radio"
              checked={maximum === 0}
              onChange={() => setMaximum(0)}
            />
            {" "}Show words with no direct descendants
          </label>
        </li>
        <li>
          <label>
            <input
              type="radio"
              checked={maximum === 1}
              onChange={() => setMaximum(1)}
            />
            {" "}Show words with at most one direct descendant
          </label>
        </li>
      </ul>
      {isPending && <p>Loading...</p>}
      {error && <p>Could not load words: {error.message}</p>}
      {words?.length === 0 && (
        <InfoParagraph>No words found.</InfoParagraph>
      )}
      {words && words.length > 0 && (
        <>
          <p>{words.length} words found.</p>
          <ul style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 3em",
            width: "70%", margin: "0 auto", textAlign: "left"
          }}>
            {words.map(word => (
              <li key={word.id}>
                <Link to={'/word/' + word.id}>
                  {word.word}
                </Link>
                {" "}({word.meaning})
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export default function ViewUnderivedWords() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(id);

  useSetPageTitle("View Underived Words");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  return (
    <ViewUnderivedWordsInner language={languageResponse.data} />
  );
}
