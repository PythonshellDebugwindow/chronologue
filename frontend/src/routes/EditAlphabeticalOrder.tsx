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

function GraphCell({ graphs, index }: { graphs: string[], index: number }) {
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
        ? <big>{ formatGraphForAlphabet(graphs[index + shift]) }</big>
        : <big style={{ visibility: "hidden" }}>
            { formatGraphForAlphabet(graphs[drag.active ? +drag.active.id : index]) }
          </big>
      }
      {
        index === drag.active?.id && (
          <div className="graph-cell-dragged" style={{ transform: CSS.Translate.toString(drag.transform) }}>
            <big>{ formatGraphForAlphabet(graphs[index]) }</big>
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

interface IEditAlphabeticalOrderInner {
  language: ILanguage;
  orthSettings: IOrthographySettings;
}

function EditAlphabeticalOrderInner({ language, orthSettings }: IEditAlphabeticalOrderInner) {
  const [ graphs, setGraphs ] = useState(orthSettings.alphabeticalOrder);
  
  const [ graphsAreSaved, setGraphsAreSaved ] = useState(orthSettings.hasSetAlphabeticalOrder);
  const [ isSavingGraphs, setIsSavingGraphs ] = useState(false);
  
  const rows = [];
  for(let i = 0; i < graphs.length; i += 10) {
    rows.push(
      <tr key={i}>
        {
          graphs.slice(i, i + 10).map(
            (_, j) => <GraphCell graphs={graphs} index={ i + j } key={j} />
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
      <h2>Edit Alphabetical Order</h2>
      <p>
        Editing <Link to={ '/language/' + language.id }>{ language.name }</Link>'s
        alphabetical order.
      </p>
      <p>
        You should only do this once you've finalised your orthography, as adding
        or removing letters will reset the order.
      </p>
      {
        !graphsAreSaved && <>
          <SaveChangesButton<string[]>
            isSaving={isSavingGraphs}
            setIsSaving={setIsSavingGraphs}
            saveQueryKey={ ['languages', language.id, 'alphabetical-order', 'update'] }
            saveQueryFn={ async () => await sendSaveOrderRequest(graphs, language.id) }
            handleSave={ data => { setGraphs(data); setGraphsAreSaved(true); } }
          >
            Save order
          </SaveChangesButton>
          <br />
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
          <br />
          <SaveChangesButton<string[]>
            isSaving={isSavingGraphs}
            setIsSaving={setIsSavingGraphs}
            saveQueryKey={ ['languages', language.id, 'alphabetical-order', 'update'] }
            saveQueryFn={ async () => await sendSaveOrderRequest(graphs, language.id) }
            handleSave={ data => { setGraphs(data); setGraphsAreSaved(true); } }
          >
            Save order
          </SaveChangesButton>
        </>
      }
    </>
  );
}

export default function EditAlphabeticalOrder() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }
  
  const languageResponse = getLanguageById(languageId);
  const orthSettingsResponse = getOrthographySettings(languageId);
  
  useSetPageTitle("Edit Alphabetical Order");

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
    <EditAlphabeticalOrderInner
      language={ languageResponse.data }
      orthSettings={ orthSettingsResponse.data }
    />
  );
};
