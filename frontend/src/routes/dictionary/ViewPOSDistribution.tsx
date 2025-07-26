import { Link } from 'react-router-dom';

import { useLanguage } from '@/hooks/languages';
import { useLanguagePOSDistribution } from '@/hooks/words';

import { ILanguage } from '@/types/languages';
import { IPOSCount } from '@/types/words';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

import styles from './ViewPOSDistribution.module.css';

interface IViewPOSDistributionInner {
  language: ILanguage;
  distribution: IPOSCount[];
}

function ViewPOSDistributionInner({ language, distribution }: IViewPOSDistributionInner) {
  return (
    <>
      <h2>View POS Distribution</h2>
      <p>
        View the distribution of parts of speech in{" "}
        <Link to={'/language/' + language.id}>{language.name}</Link>'s dictionary.
      </p>
      <table className={styles.distributionTable}>
        <tbody>
          {distribution.map(posCount => (
            <tr key={posCount.code}>
              <td>{posCount.name}</td>
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
    </>
  );
}

export default function ViewPOSDistribution() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(id);
  const distributionResponse = useLanguagePOSDistribution(id);

  useSetPageTitle("View POS Distribution");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(distributionResponse.status !== 'success') {
    return renderDatalessQueryResult(distributionResponse);
  }

  return (
    <ViewPOSDistributionInner
      language={languageResponse.data}
      distribution={distributionResponse.data}
    />
  );
}
