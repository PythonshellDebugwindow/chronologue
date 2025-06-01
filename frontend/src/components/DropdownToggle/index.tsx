import styles from './DropdownToggle.module.css';

interface IDropdownToggle {
  label: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function DropdownToggle({ label, open, setOpen }: IDropdownToggle) {
  return (
    <div>
      <span className={styles.dropdownToggle} onClick={() => setOpen(!open)}>
        {label}&nbsp;{open ? "▼" : "▶"}
      </span>
    </div>
  );
}
