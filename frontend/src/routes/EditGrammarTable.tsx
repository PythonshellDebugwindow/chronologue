import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import {
  CCheckbox, CFormBody, CMultilineTextInput, CTextInput
} from '../components/CForm.tsx';
import EditableGrammarTable from '../components/EditableGrammarTable.tsx';
import POSAndClassesSelect from '../components/POSAndClassesSelect.tsx';

import {
  editGrammarTable, getGrammarTableById, getGrammarTableClassIds,
  getGrammarTableFilledCells, IGrammarTable, IGrammarTableCell
} from '../grammarData.tsx';
import { useGetParamsOrSelectedId, useSetPageTitle } from '../utils.tsx';
import { getPartsOfSpeech, IPartOfSpeech, IWordClass } from '../wordData.tsx';
import { getWordClassesByLanguage } from '../languageData.tsx';
import { useQueryClient } from '@tanstack/react-query';

function createCellMatrix(table: IGrammarTable, filledCells: IGrammarTableCell[]) {
  const result: string[][] = [];
  for(let i = 0; i < table.rows.length; ++i) {
    result.push(Array(table.columns.length).fill(""));
  }
  for(const cell of filledCells) {
    result[cell.row][cell.column] = cell.rules;
  }
  return result;
}

interface IEditGrammarTableInner {
  table: IGrammarTable;
  initialTableClassIds: string[];
  initialFilledCells: IGrammarTableCell[];
  langClasses: IWordClass[];
  langPartsOfSpeech: IPartOfSpeech[];
}

function EditGrammarTableInner({
  table, initialTableClassIds, initialFilledCells, langClasses, langPartsOfSpeech
}: IEditGrammarTableInner) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [ name, setName ] = useState(table.name);
  const [ pos, setPos ] = useState(table.pos);
  const [ rows, setRows ] = useState(table.rows);
  const [ columns, setColumns ] = useState(table.columns);
  const [ preRules, setPreRules ] = useState(table.preRules);
  const [ postRules, setPostRules ] = useState(table.postRules);
  const [ showIpa, setShowIpa ] = useState(table.showIpa);
  const [ invertClasses, setInvertClasses ] = useState(table.invertClasses);
  const [ notes, setNotes ] = useState(table.notes);
  const [ classes, setClasses ] = useState(
    langClasses.filter(cls => initialTableClassIds.includes(cls.id))
  );
  const [ cells, setCells ] = useState(createCellMatrix(table, initialFilledCells));

  const [ message, setMessage ] = useState("");

  async function editFormTable() {
    if(!pos) {
      setMessage("Please choose a part of speech");
      return;
    }
    
    const result = await editGrammarTable(table.id, {
      name,
      pos,
      rows,
      columns,
      preRules,
      postRules,
      showIpa,
      classIds: classes.map(cls => cls.id),
      invertClasses,
      notes,
      cells
    });
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }

    navigate('/grammar-table/' + table.id);
    queryClient.resetQueries({ queryKey: ['grammar-tables', table.id] });
  }
  
  return (
    <>
      <h2>Edit Grammar Table</h2>
      { message && <p><b>{message}</b></p> }
      <form className="chronologue-form" style={{ marginBottom: "1em" }}>
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
          <CMultilineTextInput
            label="Pre Rules"
            name="pre-rules"
            state={preRules}
            setState={setPreRules}
            height="4em"
          />
        </CFormBody>
      </form>
      <p className="grammar-table-paragraph">
        Rules in the below table are run through <Link to="/chronosca">ChronoSCA</Link>.
        Pre rules are run on the word to be inflected before the rules in the table; post
        rules are applied to the result of each table cell. Empty table cells are treated
        as invalid forms.
      </p>
      <EditableGrammarTable
        rows={rows}
        columns={columns}
        cells={cells}
        setRows={setRows}
        setColumns={setColumns}
        setCells={setCells}
      />
      { message && <p><b>{message}</b></p> }
      <form className="chronologue-form" style={{ marginTop: "1em" }}>
        <CFormBody>
          <CMultilineTextInput
            label="Post Rules"
            name="post-rules"
            state={postRules}
            setState={setPostRules}
            height="4em"
          />
          <CMultilineTextInput
            label="Notes"
            name="notes"
            state={notes}
            setState={setNotes}
            height="4em"
          />
        </CFormBody>
        <button type="button" onClick={editFormTable}>
          Save
        </button>
      </form>
    </>
  );
};

function EditGrammarTableWithTable({ table }: { table: IGrammarTable }) {
  const tableClassIdsResponse = getGrammarTableClassIds(table.id);
  const langClassesResponse = getWordClassesByLanguage(table.langId);
  const cellsResponse = getGrammarTableFilledCells(table.id);
  const partsOfSpeechResponse = getPartsOfSpeech();
  
  if(tableClassIdsResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(tableClassIdsResponse.status === 'error') {
    return (
      <p>{ tableClassIdsResponse.error.message }</p>
    );
  }
  
  if(langClassesResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(langClassesResponse.status === 'error') {
    return (
      <p>{ langClassesResponse.error.message }</p>
    );
  }
  
  if(cellsResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(cellsResponse.status === 'error') {
    return (
      <p>{ cellsResponse.error.message }</p>
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
    <EditGrammarTableInner
      table={table}
      initialTableClassIds={ tableClassIdsResponse.data }
      initialFilledCells={ cellsResponse.data }
      langClasses={ langClassesResponse.data }
      langPartsOfSpeech={ partsOfSpeechResponse.data }
    />
  );
}

export default function EditGrammarTable() {
  const tableId = useGetParamsOrSelectedId();
  if(!tableId) {
    throw new Error("No table ID was provided");
  }
  
  const tableResponse = getGrammarTableById(tableId);
  
  useSetPageTitle("Edit Grammar Table");

  if(tableResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(tableResponse.status === 'error') {
    return (
      <>
        <h2>{ tableResponse.error.title }</h2>
        <p>{ tableResponse.error.message }</p>
      </>
    );
  }

  return <EditGrammarTableWithTable table={ tableResponse.data } />;
};
