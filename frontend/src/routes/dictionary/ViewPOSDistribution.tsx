import { useState } from 'react';
import { Link } from 'react-router-dom';

import DistributionTable from '@/components/DistributionTable';
import LinkButton from '@/components/LinkButton';
import { InfoParagraph } from '@/components/Paragraphs';

import { useLanguage } from '@/hooks/languages';
import {
  useLanguagePOSDistribution,
  useLanguageWordClassDistribution
} from '@/hooks/words';

import { ILanguage } from '@/types/languages';
import { IPartOfSpeech, IPOSCount, IWordClassCount } from '@/types/words';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

interface IPOSDistributionTable {
  language: ILanguage;
  setPOS: (newPos: IPartOfSpeech) => void;
}

function POSDistributionTable({ language, setPOS }: IPOSDistributionTable) {
  const distributionResponse = useLanguagePOSDistribution(language.id);

  function firstColumn(posCount: IPOSCount) {
    return (
      <LinkButton onClick={() => setPOS(posCount)}>
        {posCount.name}
      </LinkButton>
    );
  }

  if(distributionResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(distributionResponse.status === 'error') {
    return <p>Error: {distributionResponse.error.message}</p>;
  }

  const distribution = distributionResponse.data;

  if(distribution.length === 0) {
    return (
      <p>No words were found in {language.name}'s dictionary.</p>
    );
  }

  return (
    <DistributionTable
      distribution={distributionResponse.data}
      firstColumn={firstColumn}
    />
  );
}

interface IWordClassDistributionTable {
  language: ILanguage;
  pos: IPartOfSpeech;
  setPOS: (newPos: null) => void;
}

function WordClassDistributionTable({ language, pos, setPOS }: IWordClassDistributionTable) {
  const distributionResponse = useLanguageWordClassDistribution(language.id, pos.code);

  function firstColumn(classCount: IWordClassCount) {
    return `[${classCount.code}] ${classCount.name}`;
  }

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
      <DistributionTable
        distribution={distribution}
        firstColumn={firstColumn}
      />
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
