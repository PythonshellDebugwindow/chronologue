import { Link }  from 'react-router-dom';

import { useWord } from '../wordData.tsx';

function useWordString(id: string) {
  const { isPending, error, data } = useWord(id);
  if(isPending) {
    return "Loading...";
  } else if(error) {
    return error.message;
  } else {
    return data.word;
  }
}

export default function WordLink({ id }: { id: string }) {
  return (
    <Link to={ '/word/' + id }>
      { useWordString(id) }
    </Link>
  );
};
