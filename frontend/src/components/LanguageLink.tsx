import { Link }  from 'react-router-dom';

import { useLanguage } from '../languageData.tsx';

function useLanguageName(id: string) {
  const { isPending, error, data } = useLanguage(id);
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
      { useLanguageName(id) }
    </Link>
  );
};
