import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useDraggable, useDroppable, DndContext, DragEndEvent, Over, Active
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import SaveChangesButton from '../components/SaveChangesButton.tsx';

import {
  getLanguageById, getOrthographySettings, ILanguage, IOrthographySettings
} from '../languageData.tsx';
import { formatGraphForAlphabet } from '../phoneData.tsx';
import {
  sendBackendJson, useGetParamsOrSelectedId, useSetPageTitle
} from '../utils.tsx';

function getGraphCellShift(index: number, over: Over | null, active: Active | null) {
  if(over && active) {
    if(+over.id < index && index <= +active.id) {
      return -1;
    } else if(+active.id <= index && index < +over.id) {
      return 1;
    }
  }
  return 0;
}

function shouldHideGraphCell(index: number, over: Over | null, active: Active | null) {
  if(over?.id === active?.id || !over) {
    return active?.id === index;
  }
  if(active && over.id > active.id) {
    return over.id === index;
  }
  return index - 1 === over.id;
}

interface IGraphCell {
  graphs: string[];
  index: number;
  orthSettings: IOrthographySettings;
}

function GraphCell({ graphs, index, orthSettings }: IGraphCell) {
  const drop = useDroppable({ id: index });
  const drag = useDraggable({ id: index });
  
  const shift = getGraphCellShift(index, drop.over, drag.active);
  const shouldHide = shouldHideGraphCell(index, drop.over, drag.active);

  const style = {
    cursor: drag.active ? "pointer" : "move",
    background: shouldHide ? undefined : "#fafafa"
  };

  function setBothNodeRefs(node: HTMLElement | null) {
    drop.setNodeRef(node);
    drag.setNodeRef(node);
  }

  return (
    <td className="graph-cell" ref={setBothNodeRefs} style={style} {...drag.listeners} {...drag.attributes}>
      {
        !shouldHide
        ? <big>
            { formatGraphForAlphabet(graphs[index + shift], orthSettings) }
          </big>
        : <big style={{ visibility: "hidden" }}>
            { formatGraphForAlphabet(graphs[drag.active ? +drag.active.id : index], orthSettings) }
          </big>
      }
      {
        index === drag.active?.id && (
          <div className="graph-cell-dragged" style={{ transform: CSS.Translate.toString(drag.transform) }}>
            <big>
              { formatGraphForAlphabet(graphs[index], orthSettings) }
            </big>
          </div>
        )
      }
    </td>
  );
}

async function sendSaveOrderRequest(order: string[], langId: string) {
  const reqBody = { order };
  const res = await sendBackendJson(`languages/${langId}/alphabetical-order`, 'PUT', reqBody);
  if(!res.ok) {
    throw res.body;
  }
  return res.body;
}

async function sendSaveOrthSettingsRequest(caseSensitive: boolean, langId: string) {
  const reqBody = { caseSensitive };
  const res = await sendBackendJson(`languages/${langId}/orth-settings`, 'PUT', reqBody);
  if(!res.ok) {
    throw res.body;
  }
  return res.body;
}

interface IEditOrthographySettingsInner {
  language: ILanguage;
  orthSettings: IOrthographySettings;
}

function EditOrthographySettingsInner({ language, orthSettings }: IEditOrthographySettingsInner) {
  const [ graphs, setGraphs ] = useState(orthSettings.alphabeticalOrder);
  const [ caseSensitive, setCaseSensitive ] = useState(orthSettings.caseSensitive);
  
  const [ graphsAreSaved, setGraphsAreSaved ] = useState(orthSettings.hasSetAlphabeticalOrder);
  const [ isSavingGraphs, setIsSavingGraphs ] = useState(false);
  
  const [ settingsAreSaved, setSettingsAreSaved ] = useState(true);
  const [ isSavingSettings, setIsSavingSettings ] = useState(false);
  
  const updatedOrthSettings = { ...orthSettings, caseSensitive };
  
  const rows = [];
  for(let i = 0; i < graphs.length; i += 10) {
    rows.push(
      <tr key={i}>
        {
          graphs.slice(i, i + 10).map(
            (_, j) => (
              <GraphCell
                graphs={graphs}
                index={ i + j }
                orthSettings={updatedOrthSettings}
                key={j}
              />
            )
          )
        }
      </tr>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    if(event.over && event.active.id !== event.over.id && event.active.id !== +event.over.id + 1) {
      const activeIndex = +event.active.id;
      const overIndex = +event.over.id;
      if(activeIndex > overIndex) {
        setGraphs([
          ...graphs.slice(0, overIndex + 1),
          graphs[activeIndex],
          ...graphs.slice(overIndex + 1, activeIndex),
          ...graphs.slice(activeIndex + 1)
        ]);
      } else {
        setGraphs([
          ...graphs.slice(0, activeIndex),
          ...graphs.slice(activeIndex + 1, overIndex + 1),
          graphs[activeIndex],
          ...graphs.slice(overIndex + 1)
        ]);
      }
      setGraphsAreSaved(false);
    }
  }
  
  return (
    <>
      <h2>Edit Orthography Settings</h2>
      <p>
        Edit <Link to={ '/language/' + language.id }>{ language.name }</Link>'s
        alphabetical order and other orthography settings.
      </p>
      <h3>Alphabetical Order</h3>
      <p className="help-paragraph">
        Edit { language.name }'s alphabetical order. You should only do this once you've
        finalised your orthography, as adding or removing letters will reset the order.
      </p>
      {
        !graphsAreSaved && <>
          <SaveChangesButton<string[]>
            isSaving={isSavingGraphs}
            setIsSaving={setIsSavingGraphs}
            saveQueryKey={ ['languages', language.id, 'alphabetical-order', 'update'] }
            saveQueryFn={ async () => await sendSaveOrderRequest(graphs, language.id) }
            handleSave={ data => { setGraphs(data); setGraphsAreSaved(true); } }
            style={{ marginBottom: "1em" }}
          >
            Save order
          </SaveChangesButton>
        </>
      }
      <DndContext onDragEnd={handleDragEnd}>
        <table className="phone-table graph-table">
          <tbody>
            { rows }
          </tbody>
        </table>
      </DndContext>
      {
        !graphsAreSaved && <>
          <SaveChangesButton<string[]>
            isSaving={isSavingGraphs}
            setIsSaving={setIsSavingGraphs}
            saveQueryKey={ ['languages', language.id, 'alphabetical-order', 'update'] }
            saveQueryFn={ async () => await sendSaveOrderRequest(graphs, language.id) }
            handleSave={ data => { setGraphs(data); setGraphsAreSaved(true); } }
            style={{ marginTop: "1em" }}
          >
            Save order
          </SaveChangesButton>
        </>
      }
      <h3>Case-Sensitivity</h3>
      <p>
        Enabling this option will cause uppercase and lowercase letters to be
        treated distinctly.
      </p>
      <div>
        <label>
          Case-sensitive?{" "}
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={
              e => { setCaseSensitive(e.target.checked); setSettingsAreSaved(false); }
            }
          />
        </label>
      </div>
      {
        !settingsAreSaved && <>
          <SaveChangesButton
            isSaving={isSavingSettings}
            setIsSaving={setIsSavingSettings}
            saveQueryKey={ ['languages', language.id, 'orth-settings', 'update'] }
            saveQueryFn={
              async () => await sendSaveOrthSettingsRequest(caseSensitive, language.id)
            }
            handleSave={ _ => setSettingsAreSaved(true) }
            style={{ marginTop: "1em" }}
          >
            Save
          </SaveChangesButton>
        </>
      }
    </>
  );
}

export default function EditOrthographySettings() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }
  
  const languageResponse = getLanguageById(languageId);
  const orthSettingsResponse = getOrthographySettings(languageId);
  
  useSetPageTitle("Edit Orthography Settings");

  if(!languageResponse.data) {
    if(languageResponse.isPending) {
      return <p>Loading...</p>;
    } else if(languageResponse.error) {
      return (
        <>
          <h2>{ languageResponse.error.title }</h2>
          <p>{ languageResponse.error.message }</p>
        </>
      );
    }
  }
  if(!orthSettingsResponse.data) {
    if(orthSettingsResponse.isPending) {
      return <p>Loading orthography settings...</p>;
    } else if(orthSettingsResponse.error) {
      return (
        <p>{ orthSettingsResponse.error.message }</p>
      );
    }
  }

  return (
    <EditOrthographySettingsInner
      language={ languageResponse.data }
      orthSettings={ orthSettingsResponse.data }
    />
  );
};
