import { useParams, Link } from 'react-router-dom';

import LanguageLink from '../components/LanguageLink.tsx';

import {
  formatDictionaryFieldValue, getPartsOfSpeech, getWordById, getWordClassesByWord,
  userFacingFieldName, IPartOfSpeech, IWord, IWordClassNoPOS
} from '../wordData.tsx';
import { useSetPageTitle } from '../utils.tsx';

function formatPosFieldValue(word: IWord, partsOfSpeech: IPartOfSpeech[]) {
  const pos = partsOfSpeech.find(pos => pos.code === word.pos);
  return pos ? pos.name : `unknown (${word.pos})`;
}

function formatClasses(classes: IWordClassNoPOS[]) {
  return (
    <ul style={{ listStyle: "none", margin: "0", padding: "0" }}>
      {
        classes.map(cls => <li key={cls.code}>
          { `[${cls.code}] ${cls.name}` }
        </li>)
      }
    </ul>
  );
}

interface IViewWordInner {
  word: IWord;
  classes: IWordClassNoPOS[];
  partsOfSpeech: IPartOfSpeech[];
}

function ViewWordInner({ word, classes, partsOfSpeech }: IViewWordInner) {
  const fields = [
    'word', 'ipa', 'meaning', 'pos', 'classes',
    'etymology', 'notes', 'created', 'updated'
  ] as (keyof IWord | 'classes')[];
  
  return (
    <>
      <h2>View Word</h2>
      <table className="info-table">
        <tbody>
          <tr>
            <th>Language:</th>
            <td>
              <LanguageLink id={ word.langId } />
            </td>
          </tr>
          {
            fields.map(field =>
              (field === 'classes' ? classes.length > 0 : word[field]) && (
                <tr key={field}>
                  <th>{ userFacingFieldName(field) }:</th>
                  <td>
                    {
                      field === 'pos'
                      ? formatPosFieldValue(word, partsOfSpeech)
                      : (field === 'classes'
                         ? formatClasses(classes)
                         : formatDictionaryFieldValue(word, field)
                        )
                    }
                  </td>
                </tr>
              )
            )
          }
        </tbody>
      </table>
      <p><Link to={ '/edit-word/' + word.id }>Edit word</Link></p>
      <p><Link to={ '/delete-word/' + word.id }>Delete word</Link></p>
    </>
  );
};

export default function ViewWord() {
  const { id } = useParams();
  if(!id) {
    throw new Error("No word ID was provided");
  }

  const wordResponse = getWordById(id);
  const classesResponse = getWordClassesByWord(id);
  const partsOfSpeechResponse = getPartsOfSpeech();
  
  useSetPageTitle("View Word");

  if(wordResponse.status === 'pending') {
    return <p>Loading word summary...</p>;
  } else if(wordResponse.status === 'error') {
    return (
      <>
        <h2>{ wordResponse.error.title }</h2>
        <p>{ wordResponse.error.message }</p>
      </>
    );
  }
  
  if(classesResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(classesResponse.status === 'error') {
    return (
      <p>{ classesResponse.error.message }</p>
    );
  }
  
  if(partsOfSpeechResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(partsOfSpeechResponse.status === 'error') {
    return (
      <p>{ partsOfSpeechResponse.error.message }</p>
    );
  }
  
  return (
    <ViewWordInner
      word={ wordResponse.data }
      classes={ classesResponse.data }
      partsOfSpeech={ partsOfSpeechResponse.data }
    />
  );
};
