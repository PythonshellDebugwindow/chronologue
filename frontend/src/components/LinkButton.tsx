import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function LinkButton({ onClick, children } : { onClick: Function, children: ReactNode }) {
  return (
    <Link to="" onClick={
      (e) => { onClick(); e.preventDefault(); return false; }
    }>
      {children}
    </Link>
  );
};
