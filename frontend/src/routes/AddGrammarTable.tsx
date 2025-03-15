import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import {
  CCheckbox, CFormBody, CMultilineTextInput, CTextInput
} from '../components/CForm.tsx';
import EditableGrammarTable from '../components/EditableGrammarTable.tsx';
import POSAndClassesSelect from '../components/POSAndClassesSelect.tsx';

import { addGrammarTable } from '../grammarData.tsx';
import {
  getLanguageById, getWordClassesByLanguage, ILanguage
} from '../languageData.tsx';
import { getPartsOfSpeech, IPartOfSpeech, IWordClass } from '../wordData.tsx';
import { useGetParamsOrSelectedId, useSetPageTitle } from '../utils.tsx';



interface IAddGrammarTableInner {
  language: ILanguage;
  langClasses: IWordClass[];
  langPartsOfSpeech: IPartOfSpeech[];
}

function AddGrammarTableInner({ language, langClasses, langPartsOfSpeech }: IAddGrammarTableInner) {
  const navigate = useNavigate();
  
  const [ name, setName ] = useState("");
  const [ pos, setPos ] = useState("");
  const [ rows, setRows ] = useState([ "Ø" ]);
  const [ columns, setColumns ] = useState([ "Ø" ]);
  const [ showIpa, setShowIpa ] = useState(false);
  const [ classes, setClasses ] = useState([] as IWordClass[]);
  const [ invertClasses, setInvertClasses ] = useState(false);
  const [ notes, setNotes ] = useState("");

  const [ message, setMessage ] = useState("");

  async function addFormTable() {
    if(!pos) {
      setMessage("Please choose a part of speech");
      return;
    }
    
    const result = await addGrammarTable({
      langId: language.id,
      name,
      pos,
      rows,
      columns,
      showIpa,
      classIds: classes.map(cls => cls.id),
      invertClasses,
      notes
    });
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }

    navigate('/grammar-table/' + result.body);
  }
  
  return (
    <>
      <h2>Add Grammar Table</h2>
      <p className="grammar-table-paragraph">
        Add a grammar table to <Link to={ '/language/' + language.id }>{ language.name }</Link>.
        Grammar tables are used to show inflected forms of words, like declensions or conjugations.
      </p>
      <p className="grammar-table-paragraph">
        If any classes are selected, the table will only apply to words with all those classes; if
        the "Invert classes" option is selected, then it will instead apply to words with none of
        them. Selecting "Show IPA" will cause an IPA estimation to be shown beneath each word form
        in the table.
      </p>
      { message && <p><b>{message}</b></p> }
      <form className="chronologue-form">
        <CFormBody>
          <CTextInput label="Name" name="name" state={name} setState={setName} />
          <POSAndClassesSelect
            pos={pos}
            setPos={setPos}
            allLangPos={langPartsOfSpeech}
            classes={classes}
            setClasses={setClasses}
            allLangClasses={langClasses}
          />
          <CCheckbox
            label="Invert classes?"
            name="invert-classes"
            labelColon={false}
            state={invertClasses}
            setState={setInvertClasses}
          />
          <CCheckbox
            label="Show IPA?"
            name="show-ipa"
            labelColon={false}
            state={showIpa}
            setState={setShowIpa}
          />
        </CFormBody>
      </form>
      <p className="grammar-table-paragraph">
        Below you can specify the table's row and column names, which should be grammatical
        abbreviations (codes) set on the <Link to="/grammar-forms">Grammar Forms page</Link>.
        For example, in a table for adjectives, the row names could be <code>SG</code> and{" "}
        <code>PL</code> and the column names could be <code>M</code> and <code>F</code> (assuming
        those forms are all defined).
      </p>
      <p className="grammar-table-paragraph">
        Multiple forms in a single row/header name can be separated with a period. The symbol
        Ø means "no form".
      </p>
      <EditableGrammarTable
        rows={rows}
        columns={columns}
        setRows={setRows}
        setColumns={setColumns}
      />
      { message && <p><b>{message}</b></p> }
      <form className="chronologue-form" style={{ marginTop: "1em" }}>
        <CFormBody>
          <CMultilineTextInput
            label="Notes"
            name="notes"
            state={notes}
            setState={setNotes}
          />
        </CFormBody>
        <button type="button" onClick={addFormTable}>
          Add Grammar Table
        </button>
      </form>
    </>
  );
};

export default function AddGrammarTable() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }
  
  const languageResponse = getLanguageById(languageId);
  const classesResponse = getWordClassesByLanguage(languageId);
  const partsOfSpeechResponse = getPartsOfSpeech();
  
  useSetPageTitle("Add Grammar Table");

  if(languageResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(languageResponse.status === 'error') {
    return (
      <>
        <h2>{ languageResponse.error.title }</h2>
        <p>{ languageResponse.error.message }</p>
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
    <AddGrammarTableInner
      language={ languageResponse.data }
      langClasses={ classesResponse.data }
      langPartsOfSpeech={ partsOfSpeechResponse.data }
    />
  );
};
