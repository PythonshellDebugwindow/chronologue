import { Dispatch, ReactNode, SetStateAction } from 'react';
import { Link } from 'react-router-dom';

import { useLanguageStringSynonyms } from '@/hooks/words';

import styles from './CNewWordInput.module.css';

function SynonymsList({ langId, word }: { langId: string, word: string }) {
  const { status, error, data: synonyms } = useLanguageStringSynonyms(langId, word);
  if(status === 'error') {
    return <b>Error: {error.message}</b>;
  } else if(status === 'pending') {
    return "Loading...";
  } else if(synonyms.length === 0) {
    return "No synonyms found.";
  } else {
    return (
      <>
        Synonyms:
        <ul className={styles.identicalWordsList}>
          {synonyms.map(synonym => (
            <li key={synonym.id}>
              <Link to={'/word/' + synonym.id}>{synonym.word}</Link>
              {" "}
              [{synonym.pos}]
            </li>
          ))}
        </ul>
      </>
    );
  }
}

interface ICNewWordInput {
  langId: string;
  label: ReactNode;
  name: string;
  state: string;
  setState: Dispatch<SetStateAction<string>>;
}

export function CNewWordMeaningInput(
  { langId, label, name, state, setState }: ICNewWordInput
) {
  return (
    <tr>
      <td style={{ verticalAlign: "top" }}>
        <label htmlFor={"cti-" + name}>{label}:</label>
      </td>
      <td>
        <input
          type="text"
          name={name}
          id={"cti-" + name}
          value={state}
          onChange={setState && (e => setState(e.target.value))}
        />
        {state && (
          <small>
            <SynonymsList
              langId={langId}
              word={state}
            />
          </small>
        )}
      </td>
    </tr>
  );
}
