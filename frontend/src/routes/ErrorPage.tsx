import { useRouteError } from 'react-router-dom';

import Header from '../components/Header.tsx';
import { useSetPageTitle } from '../utils.tsx';

function getHeaderText(error: any) {
  const message = error.statusText || error.message;
  return message ? `Error: ${message}` : "Unknown error";
}

export default function ErrorPage() {
  const error = useRouteError();
  useSetPageTitle("Error");

  return (
    <>
      <Header />
      <h2>{getHeaderText(error)}</h2>
      <p>An error has occurred.</p>
    </>
  )
};
