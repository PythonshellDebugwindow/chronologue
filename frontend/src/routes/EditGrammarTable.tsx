import { useEffect, useState, ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import {
  CCheckbox, CFormBody, CMultilineTextInput, CTextInput
} from '../components/CForm.tsx';
import EditableGrammarTable from '../components/EditableGrammarTable.tsx';
import POSAndClassesSelect from '../components/POSAndClassesSelect.tsx';

import {
  compareGrammarTables, editGrammarTable, useGrammarTable,
  useGrammarTableClassIds, useGrammarTableFilledCells, useLanguageGrammarTables,
  IGrammarTable, IGrammarTableCell, IGrammarTableOverview
} from '../grammarData.tsx';
import { useLanguageWordClasses } from '../languageData.tsx';
import {
  renderDatalessQueryResult, useGetParamsOrSelectedId, useSetPageTitle
} from '../utils.tsx';
import {
  formatPosFieldValue, usePartsOfSpeech, IPartOfSpeech, IWordClass
} from '../wordData.tsx';

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
  langTables: IGrammarTableOverview[];
  partsOfSpeech: IPartOfSpeech[];
}

function EditGrammarTableInner({
  table, initialTableClassIds, initialFilledCells, langClasses, langTables, partsOfSpeech
}: IEditGrammarTableInner) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [ tableIdToCopy, setTableIdToCopy ] = useState("");
  const copyTableQuery = useGrammarTable(
    tableIdToCopy, tableIdToCopy !== ""
  );
  const copyTableClassesQuery = useGrammarTableClassIds(
    tableIdToCopy, tableIdToCopy !== ""
  );
  const copyTableCellsQuery = useGrammarTableFilledCells(
    tableIdToCopy, tableIdToCopy !== ""
  );
  const [ shouldCopyTable, setShouldCopyTable ] = useState(false);
  
  const [ name, setName ] = useState(table.name);
  const [ pos, setPos ] = useState(table.pos);
  const [ rows, setRows ] = useState(table.rows);
  const [ columns, setColumns ] = useState(table.columns);
  const [ postRules, setPostRules ] = useState(table.postRules);
  const [ showIpa, setShowIpa ] = useState(table.showIpa);
  const [ invertClasses, setInvertClasses ] = useState(table.invertClasses);
  const [ notes, setNotes ] = useState(table.notes);
  const [ classes, setClasses ] = useState(
    langClasses.filter(cls => initialTableClassIds.includes(cls.id))
  );
  const [ cells, setCells ] = useState(createCellMatrix(table, initialFilledCells));

  const [ message, setMessage ] = useState("");
  const [ copyingMessage, setCopyingMessage ] = useState<ReactNode>(null);

  langTables.sort(compareGrammarTables);

  useEffect(() => {
    function copyTableData(table: IGrammarTable, classIds: string[], cells: IGrammarTableCell[]) {
      setPos(table.pos);
      setRows(table.rows);
      setColumns(table.columns);
      setPostRules(table.postRules);
      setShowIpa(table.showIpa);
      setInvertClasses(table.invertClasses);
      setNotes(table.notes);
      setClasses(langClasses.filter(cls => classIds.includes(cls.id)));
      setCells(createCellMatrix(table, cells));
    }

    if(shouldCopyTable) {
      if(copyTableQuery.error) {
        setCopyingMessage("Could not copy table: " + copyTableQuery.error.message);
        setShouldCopyTable(false);
      } else if(copyTableClassesQuery.error) {
        setCopyingMessage("Could not copy table: " + copyTableClassesQuery.error.message);
        setShouldCopyTable(false);
      } else if(copyTableCellsQuery.error) {
        setCopyingMessage("Could not copy table: " + copyTableCellsQuery.error.message);
        setShouldCopyTable(false);
      } else if(copyTableQuery.status === 'pending') {
        setCopyingMessage("Copying table...");
      } else if(copyTableClassesQuery.status === 'pending') {
        setCopyingMessage("Copying table...");
      } else if(copyTableCellsQuery.status === 'pending') {
        setCopyingMessage("Copying table...");
      } else {
        const copied = copyTableQuery.data;
        setShouldCopyTable(false);
        copyTableData(copied, copyTableClassesQuery.data, copyTableCellsQuery.data);
        setCopyingMessage(
          <>
            Copying:{" "}
            <Link to={ '/grammar-table/' + copied.id}>
              { copied.name && (copied.name + " ") }
              [{ formatPosFieldValue(copied.pos, partsOfSpeech) }]
            </Link>
          </>
        );
      }
    }
  }, [
    copyTableQuery, copyTableClassesQuery, copyTableCellsQuery, shouldCopyTable,
    langClasses, partsOfSpeech
  ]);

  function submitCopyTableForm() {
    if(tableIdToCopy === "") {
      alert("Please select a table first.");
      return;
    }
    if(confirm("This will overwrite anything already entered below. Continue?")) {
      setShouldCopyTable(true);
    }
  }

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
      { copyingMessage && <p>{copyingMessage}</p> }
      { message && <p><b>{message}</b></p> }
      <p>
        <label>
          Copy table:{" "}
          <select value={tableIdToCopy} onChange={ e => setTableIdToCopy(e.target.value) }>
            <option value="">---</option>
            {
              langTables.map(langTable => langTable.id !== table.id && (
                <option value={langTable.id} key={langTable.id}>
                  { langTable.name && (langTable.name + " ") }
                  [{ formatPosFieldValue(langTable.pos, partsOfSpeech) }]
                </option>
              ))
            }
          </select>
        </label>
        {" "}
        <button
          type="button"
          onClick={submitCopyTableForm}
          style={{ padding: "2px 4px", borderRadius: "5px", fontSize: "0.9em" }}
        >
          Copy
        </button>
      </p>
      <form className="chronologue-form" style={{ marginBottom: "1em" }}>
        <CFormBody>
          <CTextInput label="Name" name="name" state={name} setState={setName} />
          <POSAndClassesSelect
            pos={pos}
            setPos={setPos}
            allLangPos={partsOfSpeech}
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
        Rules in the below table are run through <Link to="/chronosca">ChronoSCA</Link>.
        Post rules are run on the result of each table cell after initial inflection.
        Empty table cells are treated as invalid forms.
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
          Save changes
        </button>
        <button type="button" onClick={ () => navigate('/grammar-table/' + table.id) }>
          Back
        </button>
      </form>
    </>
  );
};

function EditGrammarTableWithTable({ table }: { table: IGrammarTable }) {
  const tableClassIdsResponse = useGrammarTableClassIds(table.id);
  const langClassesResponse = useLanguageWordClasses(table.langId);
  const cellsResponse = useGrammarTableFilledCells(table.id);
  const tablesResponse = useLanguageGrammarTables(table.langId);
  const partsOfSpeechResponse = usePartsOfSpeech();
  
  if(tableClassIdsResponse.status !== 'success') {
    return renderDatalessQueryResult(tableClassIdsResponse);
  }
  
  if(langClassesResponse.status !== 'success') {
    return renderDatalessQueryResult(langClassesResponse);
  }
  
  if(cellsResponse.status !== 'success') {
    return renderDatalessQueryResult(cellsResponse);
  }
  
  if(tablesResponse.status !== 'success') {
    return renderDatalessQueryResult(tablesResponse);
  }
  
  if(partsOfSpeechResponse.status !== 'success') {
    return renderDatalessQueryResult(partsOfSpeechResponse);
  }

  return (
    <EditGrammarTableInner
      table={table}
      initialTableClassIds={ tableClassIdsResponse.data }
      initialFilledCells={ cellsResponse.data }
      langClasses={ langClassesResponse.data }
      langTables={ tablesResponse.data }
      partsOfSpeech={ partsOfSpeechResponse.data }
    />
  );
}

export default function EditGrammarTable() {
  const tableId = useGetParamsOrSelectedId();
  if(!tableId) {
    throw new Error("No table ID was provided");
  }
  
  const tableResponse = useGrammarTable(tableId);
  
  useSetPageTitle("Edit Grammar Table");

  if(tableResponse.status !== 'success') {
    return renderDatalessQueryResult(tableResponse);
  }

  return <EditGrammarTableWithTable table={ tableResponse.data } />;
};
