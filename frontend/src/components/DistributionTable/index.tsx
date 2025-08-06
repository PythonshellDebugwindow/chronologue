import { ReactNode } from 'react';

import styles from './DistributionTable.module.css';

interface IWithCount {
  count: number;
}

interface IDistributionTable<CountT extends IWithCount> {
  distribution: CountT[];
  firstColumn: (count: CountT) => ReactNode;
}

export default function DistributionTable<CountT extends IWithCount>(
  { distribution, firstColumn }: IDistributionTable<CountT>
) {
  return (
    <table className={styles.distributionTable}>
      <tbody>
        {distribution.map((count, i) => (
          <tr key={i}>
            <td>
              {firstColumn(count)}
            </td>
            <td>
              {count.count}
            </td>
            <td>
              <div
                style={{ width: count.count / distribution[0].count * 100 + "%" }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
