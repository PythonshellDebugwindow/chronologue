import { useEffect, useState, ReactNode } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

import {
  CCheckbox,
  CForm,
  CFormBody,
  CMultilineTextInput,
  CTextInput
} from '@/components/CForm';
import EditableGrammarTable from '@/components/EditableGrammarTable';
import { InfoParagraph } from '@/components/Paragraphs';
import POSAndClassesSelect from '@/components/POSAndClassesSelect';

import {
  useGrammarTable,
  useGrammarTableClassIds,
  useLanguageGrammarTables
} from '@/hooks/grammar';
import { usePartsOfSpeech } from '@/hooks/words';

import { useLanguage, useLanguageWordClasses } from '@/hooks/languages';

import { IGrammarTable, IGrammarTableOverview } from '@/types/grammar';
import { ILanguage } from '@/types/languages';
import { IPartOfSpeech, IWordClass } from '@/types/words';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

import { compareGrammarTables } from '@/utils/grammar';
import { formatPosFieldValue } from '@/utils/words';

interface IAddGrammarTableInner {
  language: ILanguage;
  langClasses: IWordClass[];
  langTables: IGrammarTableOverview[];
  partsOfSpeech: IPartOfSpeech[];
}

function AddGrammarTableInner({ language, langClasses, langTables, partsOfSpeech }: IAddGrammarTableInner) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tableIdToCopy, setTableIdToCopy] = useState("");
  const copyTableQuery = useGrammarTable(
    tableIdToCopy || (searchParams.get('copy') ?? ""),
    tableIdToCopy !== "" || searchParams.has('copy')
  );
  const copyTableClassesQuery = useGrammarTableClassIds(
    tableIdToCopy || (searchParams.get('copy') ?? ""),
    tableIdToCopy !== "" || searchParams.has('copy')
  );
  const [shouldCopyTable, setShouldCopyTable] = useState(searchParams.has('copy'));

  const [name, setName] = useState("");
  const [pos, setPos] = useState("");
  const [rows, setRows] = useState(["Ø"]);
  const [columns, setColumns] = useState(["Ø"]);
  const [showIpa, setShowIpa] = useState(false);
  const [classes, setClasses] = useState<IWordClass[]>([]);
  const [invertClasses, setInvertClasses] = useState(false);
  const [notes, setNotes] = useState("");

  const [message, setMessage] = useState("");
  const [copyingMessage, setCopyingMessage] = useState<ReactNode>(null);

  langTables.sort(compareGrammarTables);

  useEffect(() => {
    function copyTableData(table: IGrammarTable, classIds: string[]) {
      setName(table.name);
      setPos(table.pos);
      setRows(table.rows);
      setColumns(table.columns);
      setShowIpa(table.showIpa);
      setClasses(langClasses.filter(cls => classIds.includes(cls.id)));
      setInvertClasses(table.invertClasses);
      setNotes(table.notes);
    }

    if(shouldCopyTable) {
      if(copyTableQuery.error) {
        setCopyingMessage("Could not copy table: " + copyTableQuery.error.message);
        setShouldCopyTable(false);
      } else if(copyTableClassesQuery.error) {
        setCopyingMessage("Could not copy table: " + copyTableClassesQuery.error.message);
        setShouldCopyTable(false);
      } else if(copyTableQuery.status === 'pending') {
        setCopyingMessage("Copying table...");
      } else if(copyTableClassesQuery.status === 'pending') {
        setCopyingMessage("Copying table...");
      } else {
        const copied = copyTableQuery.data;
        setShouldCopyTable(false);
        copyTableData(copied, copyTableClassesQuery.data);
        setCopyingMessage(
          <>
            Copying:{" "}
            <Link to={'/grammar-table/' + copied.id}>
              {copied.name && (copied.name + " ")}
              [{formatPosFieldValue(copied.pos, partsOfSpeech)}]
            </Link>
          </>
        );
      }
    }
  }, [
    copyTableQuery, copyTableClassesQuery, shouldCopyTable,
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

  async function addFormTable() {
    if(!pos) {
      setMessage("Please choose a part of speech");
      return;
    }

    const data = {
      langId: language.id,
      name,
      pos,
      rows,
      columns,
      showIpa,
      classIds: classes.map(cls => cls.id),
      invertClasses,
      notes
    };
    const result = await sendBackendJson('grammar-tables', 'POST', data);
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }

    navigate('/grammar-table/' + result.body);
  }

  return (
    <>
      <h2>Add Grammar Table</h2>
      <InfoParagraph>
        Add a grammar table to <Link to={'/language/' + language.id}>{language.name}</Link>.
        Grammar tables are used to show inflected forms of words, like declensions or conjugations.
      </InfoParagraph>
      <InfoParagraph>
        If any classes are selected, the table will only apply to words with all those classes; if
        the "Invert classes" option is selected, then it will instead apply to words with none of
        them. Selecting "Show IPA" will cause an IPA estimation to be shown beneath each word form
        in the table.
      </InfoParagraph>
      {copyingMessage && <p>{copyingMessage}</p>}
      {message && <p><b>{message}</b></p>}
      <p>
        <label>
          Copy table:{" "}
          <select value={tableIdToCopy} onChange={e => setTableIdToCopy(e.target.value)}>
            <option value="">---</option>
            {langTables.map(table => (
              <option value={table.id} key={table.id}>
                {table.name && (table.name + " ")}
                [{formatPosFieldValue(table.pos, partsOfSpeech)}]
              </option>
            ))}
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
      <CForm>
        <CFormBody>
          <CTextInput
            label="Name"
            name="name"
            state={name}
            setState={setName}
          />
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
      </CForm>
      <InfoParagraph>
        Below you can specify the table's row and column names, which should be grammatical
        abbreviations (codes) set on the <Link to="/grammar-forms">Grammar Forms page</Link>.
        For example, in a table for adjectives, the row names could be <code>SG</code> and{" "}
        <code>PL</code> and the column names could be <code>M</code> and <code>F</code> (assuming
        those forms are all defined).
      </InfoParagraph>
      <InfoParagraph>
        Multiple forms in a single row/header name can be separated with a period. The symbol
        Ø means "no form".
      </InfoParagraph>
      <EditableGrammarTable
        rows={rows}
        columns={columns}
        setRows={setRows}
        setColumns={setColumns}
      />
      {message ? <p><b>{message}</b></p> : <br />}
      <CForm>
        <CFormBody>
          <CMultilineTextInput
            label="Notes"
            name="notes"
            state={notes}
            setState={setNotes}
            height="4em"
          />
        </CFormBody>
        <button type="button" onClick={addFormTable}>
          Add Grammar Table
        </button>
      </CForm>
    </>
  );
}

export default function AddGrammarTable() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);
  const classesResponse = useLanguageWordClasses(languageId);
  const tablesResponse = useLanguageGrammarTables(languageId);
  const partsOfSpeechResponse = usePartsOfSpeech();

  useSetPageTitle("Add Grammar Table");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(classesResponse.status !== 'success') {
    return renderDatalessQueryResult(classesResponse);
  }

  if(tablesResponse.status !== 'success') {
    return renderDatalessQueryResult(tablesResponse);
  }

  if(partsOfSpeechResponse.status !== 'success') {
    return renderDatalessQueryResult(partsOfSpeechResponse);
  }

  return (
    <AddGrammarTableInner
      language={languageResponse.data}
      langClasses={classesResponse.data}
      langTables={tablesResponse.data}
      partsOfSpeech={partsOfSpeechResponse.data}
    />
  );
}
