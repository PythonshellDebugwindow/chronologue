import { Link } from 'react-router-dom';

import { IGrammarTableOverview } from '../grammarData.tsx';
import { formatPosFieldValue, IPartOfSpeech } from '../wordData.tsx';

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
