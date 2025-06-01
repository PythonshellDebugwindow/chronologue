import { ComponentPropsWithoutRef, CSSProperties, forwardRef, ReactNode } from 'react';

import styles from './PhoneTable.module.css';

interface IPhoneTable {
  style?: CSSProperties;
  separate?: boolean;
  children: ReactNode;
}

export function PhoneTable({ style, separate = false, children }: IPhoneTable) {
  const graphTableClass = separate ? " " + styles.graphTable : "";
  return (
    <table className={styles.phoneTable + graphTableClass} style={style}>
      <tbody>
        {children}
      </tbody>
    </table>
  );
}

interface IPhoneTableCell {
  added?: boolean;
  onClick?: () => void;
  colSpan?: number;
  children: ReactNode;
}

export function PhoneTableCell(
  { added = false, onClick, colSpan = 1, children }: IPhoneTableCell
) {
  const addedClass = added ? " " + styles.added : "";
  const pointerClass = onClick ? " " + styles.pointer : "";
  return (
    <td
      className={styles.phoneCell + addedClass + pointerClass}
      onClick={onClick}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
}

type GraphTableCellProps = ComponentPropsWithoutRef<'td'>;

export const GraphTableCell = forwardRef<HTMLTableCellElement, GraphTableCellProps>(
  (props, ref) => <td className={styles.graphCell} ref={ref} {...props} />
);

interface IGraphTableCellDragged {
  style: CSSProperties;
  children: ReactNode;
}

export function GraphTableCellDragged({ style, children }: IGraphTableCellDragged) {
  return <div className={styles.graphCellDragged} style={style}>{children}</div>;
}
