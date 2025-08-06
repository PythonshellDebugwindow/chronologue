import { Link } from 'react-router-dom';

import DistributionTable from '@/components/DistributionTable';
import { InfoParagraph } from '@/components/Paragraphs';

import { useLanguage } from '@/hooks/languages';
import { useLanguageLetterDistribution } from '@/hooks/words';

import { ILanguage } from '@/types/languages';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

function ViewLetterDistributionInner({ language }: { language: ILanguage }) {
  const distributionResponse = useLanguageLetterDistribution(language.id);

  if(distributionResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(distributionResponse.status === 'error') {
    return <p>Error: {distributionResponse.error.message}</p>;
  }

  const distribution = distributionResponse.data;

  return (
    <>
      <h2>View Letter Distribution</h2>
      <InfoParagraph>
        Viewing the distribution of letters in{" "}
        <Link to={'/language/' + language.id}>{language.name}</Link>'s words.
      </InfoParagraph>
      {distribution.length === 0 && (
        <p>No valid graphs were found in {language.name}'s dictionary.</p>
      )}
      <DistributionTable
        distribution={distribution}
        firstColumn={letterCount => letterCount.letter}
      />
    </>
  );
}

export default function ViewLetterDistribution() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(id);

  useSetPageTitle("View Letter Distribution");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  return (
    <ViewLetterDistributionInner language={languageResponse.data} />
  );
}
