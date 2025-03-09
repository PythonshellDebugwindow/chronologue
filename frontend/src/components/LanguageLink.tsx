import { Link }  from 'react-router-dom';

import { getLanguageById } from '../languageData.tsx';

function getLanguageName(id: string) {
  const { isPending, error, data } = getLanguageById(id);
  if(isPending) {
    return "Loading...";
  } else if(error) {
    return error.message;
  } else {
    return data.name;
  }
}

export default function LanguageLink({ id }: { id: string }) {
  return (
    <Link to={ '/language/' + id }>
      { getLanguageName(id) }
    </Link>
  );
};
