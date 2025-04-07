import { Link }  from 'react-router-dom';

import { useFamily } from '../familyData';

function useFamilyName(id: string) {
  const { isPending, error, data } = useFamily(id);
  if(isPending) {
    return "Loading...";
  } else if(error) {
    return error.message;
  } else {
    return data.name;
  }
}

export default function FamilyLink({ id }: { id: string }) {
  return (
    <Link to={ '/family/' + id }>
      { useFamilyName(id) }
    </Link>
  );
};
