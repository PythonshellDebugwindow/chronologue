import { Link } from 'react-router-dom';

import { useWordOverviewWithLanguageStatus } from '@/hooks/words';

function WordDisplay({ id }: { id: string }) {
  const { isPending, error, data } = useWordOverviewWithLanguageStatus(id);
  if(isPending) {
    return "Loading...";
  } else if(error) {
    return "Error: " + error.message;
  } else {
    return (
      <>
        {data.langStatus === 'proto' && "*"}
        <i>{data.word}</i>
      </>
    );
  }
}

export default function WordLink({ id }: { id: string }) {
  return (
    <Link to={'/word/' + id}>
      <WordDisplay id={id} />
    </Link>
  );
}
