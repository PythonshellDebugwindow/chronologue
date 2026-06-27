import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';

import { DictionaryTable } from '@/components/Dictionary';
import { InfoParagraph } from '@/components/Paragraphs';

import { useLanguage } from '@/hooks/languages';
import { useLanguageSwadeshListEntries } from '@/hooks/words';

import { ILanguage } from '@/types/languages';
import { ILanguageSwadeshListEntry } from '@/types/words';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

interface IViewPOSDistributionInner {
  language: ILanguage;
  list: ILanguageSwadeshListEntry[];
}

function ViewSwadeshListInner({ language, list }: IViewPOSDistributionInner) {
  const [showing, setShowing] = useState<'all' | 'unadded'>('all');

  return (
    <>
      <h2>View Swadesh List</h2>
      <InfoParagraph>
        Viewing the Swadesh list in <Link to={'/language/' + language.id}>{language.name}</Link>.
        This can show you if you might be missing some basic vocabulary.
      </InfoParagraph>
      {list.length === 0 && (
        <InfoParagraph>The list currently contains no words.</InfoParagraph>
      )}
      <InfoParagraph>
        <Link to="/edit-swadesh-list">[edit list]</Link>
      </InfoParagraph>
      {list.length > 0 && (
        <p>
          <label>
            Showing:{" "}
            <select value={showing} onChange={e => setShowing(e.target.value as typeof showing)}>
              <option value="all">All words</option>
              <option value="unadded">Unadded only</option>
            </select>
          </label>
        </p>
      )}
      <DictionaryTable>
        {list.length > 0 && (
          <tr style={{ borderTop: "1px solid #eee" }}>
            <th>Word</th>
            <th>{language.name}</th>
          </tr>
        )}
        {list.map(entry => (showing === 'all' || entry.languageWords.length === 0) && (
          <tr key={entry.listWord}>
            <td>{entry.listWord}</td>
            <td>
              {entry.languageWords.length === 0 && (
                <span style={{ color: "red" }}>
                  No words found{" "}
                  <Link to={`/add-word/${language.id}?meaning=${entry.listWord}`}>[add]</Link>
                </span>
              )}
              {entry.languageWords.flatMap(word => [
                <Fragment key={word.id}>
                  <Link to={'/word/' + word.id}>
                    {language.status === 'proto' && "*"}
                    <i>{word.word}</i>
                  </Link>
                  {" "}({word.meaning}) [{word.pos}]
                </Fragment>,
                ", "
              ]).slice(0, -1)}
            </td>
          </tr>
        ))}
      </DictionaryTable>
    </>
  );
}

export default function ViewSwadeshList() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(id);
  const listResponse = useLanguageSwadeshListEntries(id);

  useSetPageTitle("View Swadesh List");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(listResponse.status !== 'success') {
    return renderDatalessQueryResult(listResponse);
  }

  return (
    <ViewSwadeshListInner
      language={languageResponse.data}
      list={listResponse.data}
    />
  );
}
