import styles from './LetterButtons.module.css';

const letterButtonSmallClasses = `${styles.letterButton} ${styles.buttonSmall} `;

interface ILetterButton {
  onClick: () => void;
}

export function LetterButtonPlus({ onClick }: ILetterButton) {
  return (
    <span onClick={onClick} className={styles.hoverLightGrey}>
      <span className={letterButtonSmallClasses + styles.buttonPlus} />
    </span>
  );
}

export function LetterButtonRefresh({ onClick }: ILetterButton) {
  return (
    <span onClick={onClick} className={styles.hoverLightGrey}>
      <span className={letterButtonSmallClasses + styles.buttonRefresh} />
    </span>
  );
}

export function LetterButtonX({ onClick }: ILetterButton) {
  return (
    <span onClick={onClick} className={styles.hoverLightGrey}>
      <span className={letterButtonSmallClasses + styles.buttonX} />
    </span>
  );
}

export function LetterButtonXNoShadow({ onClick }: ILetterButton) {
  return (
    <button onClick={onClick} className={styles.letterButton + " " + styles.buttonX} />
  );
}
