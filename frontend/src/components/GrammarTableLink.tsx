import { Link } from 'react-router-dom';

import { IGrammarTableOverview } from '@/types/grammar';
import { IPartOfSpeech } from '@/types/words';

import { formatPosFieldValue } from '@/utils/words';

interface IGrammarTableLink {
  table: IGrammarTableOverview;
  partsOfSpeech: IPartOfSpeech[];
}

export default function GrammarTableLink({ table, partsOfSpeech }: IGrammarTableLink) {
  return (
    <Link to={'/grammar-table/' + table.id}>
      {table.name && (table.name + " ")}
      [{formatPosFieldValue(table.pos, partsOfSpeech)}]
    </Link>
  );
};
