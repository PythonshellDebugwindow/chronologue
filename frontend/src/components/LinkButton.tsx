import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ILinkButton {
  onClick: () => void;
  children: ReactNode;
}

export default function LinkButton({ onClick, children }: ILinkButton) {
  return (
    <Link
      to=""
      onClick={e => { onClick(); e.preventDefault(); return false; }}
    >
      {children}
    </Link>
  );
};
