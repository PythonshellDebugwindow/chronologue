import { useState } from 'react';
import { Link } from 'react-router-dom';

import { CCheckbox } from '@/components/CForm';
import DistributionTable from '@/components/DistributionTable';
import { InfoParagraph } from '@/components/Paragraphs';

import { useLanguage } from '@/hooks/languages';
import { useLanguageLetterDistribution } from '@/hooks/words';

import { ILanguage } from '@/types/languages';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

interface ILetterDistributionTable {
  language: ILanguage;
  ignorePunctuation: boolean;
}

function LetterDistributionTable({ language, ignorePunctuation }: ILetterDistributionTable) {
  const distributionResponse = useLanguageLetterDistribution(language.id, ignorePunctuation);

  if(distributionResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(distributionResponse.status === 'error') {
    return <p>Error: {distributionResponse.error.message}</p>;
  }

  const distribution = distributionResponse.data;

  if(distribution.length === 0) {
    return (
      <p>No valid graphs were found in {language.name}'s dictionary.</p>
    );
  }

  return (
    <DistributionTable
      distribution={distribution}
      firstColumn={letterCount => letterCount.letter}
    />
  );
}

function ViewLetterDistributionInner({ language }: { language: ILanguage }) {
  const [ignorePunctuation, setIgnorePunctuation] = useState(true);

  return (
    <>
      <h2>View Letter Distribution</h2>
      <InfoParagraph>
        Viewing the distribution of letters in{" "}
        <Link to={'/language/' + language.id}>{language.name}</Link>'s words.
      </InfoParagraph>
      <table style={{ textAlign: "left", margin: "0 auto" }}>
        <tbody>
          <CCheckbox
            label="Ignore punctuation?"
            name="punctuation"
            state={ignorePunctuation}
            setState={setIgnorePunctuation}
          />
        </tbody>
      </table>
      <LetterDistributionTable
        language={language}
        ignorePunctuation={ignorePunctuation}
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
