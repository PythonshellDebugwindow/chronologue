import { useState } from 'react';
import { Link } from 'react-router-dom';

import LinkButton from '@/components/LinkButton';
import { InfoParagraph } from '@/components/Paragraphs';

import { useLanguage } from '@/hooks/languages';
import {
  useLanguagePOSDistribution,
  useLanguageWordClassDistribution
} from '@/hooks/words';

import { ILanguage } from '@/types/languages';
import { IPartOfSpeech } from '@/types/words';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

import styles from './ViewPOSDistribution.module.css';

interface IPOSDistributionTable {
  language: ILanguage;
  setPOS: (newPos: IPartOfSpeech) => void;
}

function POSDistributionTable({ language, setPOS }: IPOSDistributionTable) {
  const distributionResponse = useLanguagePOSDistribution(language.id);

  if(distributionResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(distributionResponse.status === 'error') {
    return <p>Error: {distributionResponse.error.message}</p>;
  }

  const distribution = distributionResponse.data;

  return (
    <table className={styles.distributionTable}>
      <tbody>
        {distribution.map(posCount => (
          <tr key={posCount.code}>
            <td>
              <LinkButton onClick={() => setPOS(posCount)}>
                {posCount.name}
              </LinkButton>
            </td>
            <td>{posCount.count}</td>
            <td>
              <div
                style={{ width: posCount.count / distribution[0].count * 100 + "%" }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface IWordClassDistributionTable {
  language: ILanguage;
  pos: IPartOfSpeech;
  setPOS: (newPos: null) => void;
}

function WordClassDistributionTable({ language, pos, setPOS }: IWordClassDistributionTable) {
  const distributionResponse = useLanguageWordClassDistribution(language.id, pos.code);

  if(distributionResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(distributionResponse.status === 'error') {
    return <p>Error: {distributionResponse.error.message}</p>;
  }

  const distribution = distributionResponse.data;

  return (
    <>
      <LinkButton onClick={() => setPOS(null)}>
        Back to POS distribution
      </LinkButton>
      {
        distribution.length > 0
          ? <p>Showing word classes for a single part of speech ({pos.name}).</p>
          : <p>No word classes found for this part of speech ({pos.name}).</p>
      }
      <table className={styles.distributionTable}>
        <tbody>
          {distribution.map(classCount => (
            <tr key={classCount.code}>
              <td>
                [{classCount.code}] {classCount.name}
              </td>
              <td>{classCount.count}</td>
              <td>
                <div
                  style={{ width: classCount.count / distribution[0].count * 100 + "%" }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

interface IViewPOSDistributionInner {
  language: ILanguage;
}

function ViewPOSDistributionInner({ language }: IViewPOSDistributionInner) {
  const [pos, setPOS] = useState<IPartOfSpeech | null>(null);

  return (
    <>
      <h2>View POS Distribution</h2>
      <InfoParagraph>
        Viewing the distribution of parts of speech in{" "}
        <Link to={'/language/' + language.id}>{language.name}</Link>'s dictionary.
        Click on a part of speech to view the distribution of its word classes.
      </InfoParagraph>
      {pos && (
        <WordClassDistributionTable
          language={language}
          pos={pos}
          setPOS={setPOS}
        />
      )}
      {!pos && (
        <POSDistributionTable
          language={language}
          setPOS={setPOS}
        />
      )}
    </>
  );
}

export default function ViewPOSDistribution() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(id);

  useSetPageTitle("View POS Distribution");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  return (
    <ViewPOSDistributionInner language={languageResponse.data} />
  );
}
