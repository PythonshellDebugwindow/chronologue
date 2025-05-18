interface IDropdownToggle {
  label: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function DropdownToggle({ label, open, setOpen }: IDropdownToggle) {
  return (
    <div className="dropdown-toggle">
      <span onClick={() => setOpen(!open)}>
        {label}&nbsp;{open ? "▼" : "▶"}
      </span>
    </div>
  );
};
