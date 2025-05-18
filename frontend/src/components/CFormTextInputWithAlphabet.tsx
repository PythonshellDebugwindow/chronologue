import { Dispatch, ReactNode, SetStateAction, useRef, useState } from 'react';

import DropdownToggle from './DropdownToggle.tsx';

import { IOrthographySettings, useLanguageOrthographySettings } from '../languageData.tsx';
import { getGraphFormatTypeForAlphabet } from '../phoneData.tsx';
import { assertUnreachable } from '../utils.tsx';

interface IInsertAlphabetGraph {
  graph: string;
  insertGraph: (graph: string) => void;
}

function InsertAlphabetGraph({ graph, insertGraph }: IInsertAlphabetGraph) {
  return <span onClick={() => insertGraph(graph)}>{graph}</span>;
}

interface IAlphabetListingLetter {
  langId: string;
  graph: string;
  orthSettings: IOrthographySettings;
  insertGraph: (graph: string) => void;
}

function AlphabetListingGraph({ graph, orthSettings, insertGraph }: IAlphabetListingLetter) {
  const formatType = getGraphFormatTypeForAlphabet(graph, orthSettings);
  switch(formatType) {
    case 'id':
      return (
        <InsertAlphabetGraph
          graph={graph}
          insertGraph={insertGraph}
        />
      );
    case 'upper-lower':
    case 'upper-space-lower':
      return (
        <>
          <InsertAlphabetGraph
            graph={graph.toUpperCase()}
            insertGraph={insertGraph}
          />
          {formatType === 'upper-space-lower' && <>&nbsp;</>}
          <InsertAlphabetGraph
            graph={graph.toLowerCase()}
            insertGraph={insertGraph}
          />
        </>
      );
    default:
      assertUnreachable(formatType);
  }
}

interface IAlphabetListing {
  langId: string;
  insertGraph: (graph: string) => void;
}

function AlphabetListing({ langId, insertGraph }: IAlphabetListing) {
  const { status, error, data: orthSettings } = useLanguageOrthographySettings(langId);
  if(status === 'error') {
    return <b>Error: {error.message}</b>;
  } else if(status === 'pending') {
    return "Loading...";
  } else if(orthSettings.alphabeticalOrder.length === 0) {
    return "You have not set any letters.";
  } else {
    return (
      <div className="clickable-alphabet-listing">
        {
          orthSettings.alphabeticalOrder.map(
            (graph, i) => (
              <span key={i}>
                <AlphabetListingGraph
                  langId={langId}
                  graph={graph}
                  orthSettings={orthSettings}
                  insertGraph={insertGraph}
                />
              </span>
            )
          )
        }
      </div>
    );
  }
}

function AlphabetListingDropdown({ langId, insertGraph }: IAlphabetListing) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DropdownToggle
        label="Alphabet"
        open={open}
        setOpen={setOpen}
      />
      {open && <AlphabetListing langId={langId} insertGraph={insertGraph} />}
    </>
  );
}

interface ITextInputWithAlphabet {
  langId: string;
  label: ReactNode;
  name: string;
  state: string;
  setState: Dispatch<SetStateAction<string>>;
}

export default function CTextInputWithAlphabet(
  { langId, label, name, state, setState }: ITextInputWithAlphabet
) {
  const inputRef = useRef<HTMLInputElement>(null);

  function insertGraph(graph: string) {
    if(inputRef.current && inputRef.current.selectionEnd !== null) {
      const index = inputRef.current.selectionEnd;
      setState(state.substring(0, index) + graph + state.substring(index));
      inputRef.current.focus();
      setTimeout(() => {
        const cursorIndex = index + graph.length;
        inputRef.current?.setSelectionRange(cursorIndex, cursorIndex);
      });
    }
  }

  return (
    <>
      <tr>
        <td className="clickable-alphabet-td" colSpan={2}>
          <AlphabetListingDropdown
            langId={langId}
            insertGraph={insertGraph}
          />
        </td>
      </tr>
      <tr>
        <td>
          <label htmlFor={"cti-" + name}>{label}:</label>
        </td>
        <td>
          <input
            type="text"
            name={name}
            id={"cti-" + name}
            value={state}
            onChange={setState && (e => setState(e.target.value))}
            ref={inputRef}
          />
        </td>
      </tr>
    </>
  );
};
