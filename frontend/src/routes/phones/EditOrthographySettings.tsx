import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Active, DndContext, DragEndEvent, Over, useDraggable, useDroppable
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { InfoParagraph } from '@/components/Paragraphs';
import {
  GraphTableCell,
  GraphTableCellDragged,
  PhoneTable
} from '@/components/PhoneTable';
import SaveChangesButton from '@/components/SaveChangesButton';

import { useLanguage, useLanguageOrthographySettings } from '@/hooks/languages';

import { ILanguage, IOrthographySettings } from '@/types/languages';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

import { formatGraphForAlphabet } from '@/utils/phones';

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
    <GraphTableCell
      ref={setBothNodeRefs}
      style={style}
      {...drag.listeners}
      {...drag.attributes}
    >
      {
        !shouldHide
          ? <big>
              {formatGraphForAlphabet(graphs[index + shift], orthSettings)}
            </big>
          : <big style={{ visibility: "hidden" }}>
              {formatGraphForAlphabet(graphs[drag.active ? +drag.active.id : index], orthSettings)}
            </big>
      }
      {index === drag.active?.id && (
        <GraphTableCellDragged
          style={{ transform: CSS.Translate.toString(drag.transform) }}
        >
          <big>
            {formatGraphForAlphabet(graphs[index], orthSettings)}
          </big>
        </GraphTableCellDragged>
      )}
    </GraphTableCell>
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

interface IEditAlphabeticalOrder {
  language: ILanguage;
  orthSettings: IOrthographySettings;
  caseSensitive: boolean;
}

function EditAlphabeticalOrder({ language, orthSettings, caseSensitive }: IEditAlphabeticalOrder) {
  const [graphs, setGraphs] = useState(orthSettings.alphabeticalOrder);

  const [graphsAreSaved, setGraphsAreSaved] = useState(orthSettings.hasSetAlphabeticalOrder);
  const [isSavingGraphs, setIsSavingGraphs] = useState(false);

  const updatedOrthSettings = { ...orthSettings, caseSensitive };

  const rows = [];
  for(let i = 0; i < graphs.length; i += 10) {
    rows.push(
      <tr key={i}>
        {graphs.slice(i, i + 10).map((_, j) => (
          <GraphCell
            graphs={graphs}
            index={i + j}
            orthSettings={updatedOrthSettings}
            key={j}
          />
        ))}
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
      <InfoParagraph>
        Edit {language.name}'s alphabetical order. You should only do this once you've
        finalised your orthography, as adding or removing letters will reset the order.
      </InfoParagraph>
      {!graphsAreSaved && (
        <SaveChangesButton
          isSaving={isSavingGraphs}
          setIsSaving={setIsSavingGraphs}
          saveQueryKey={['languages', language.id, 'alphabetical-order', 'update']}
          saveQueryFn={async () => await sendSaveOrderRequest(graphs, language.id)}
          handleSave={data => { setGraphs(data); setGraphsAreSaved(true); }}
          style={{ marginBottom: "1em" }}
        >
          Save order
        </SaveChangesButton>
      )}
      <DndContext onDragEnd={handleDragEnd}>
        <PhoneTable separate>
          {rows}
        </PhoneTable>
      </DndContext>
      {!graphsAreSaved && (
        <SaveChangesButton
          isSaving={isSavingGraphs}
          setIsSaving={setIsSavingGraphs}
          saveQueryKey={['languages', language.id, 'alphabetical-order', 'update']}
          saveQueryFn={async () => await sendSaveOrderRequest(graphs, language.id)}
          handleSave={data => { setGraphs(data); setGraphsAreSaved(true); }}
          style={{ marginTop: "1em" }}
        >
          Save order
        </SaveChangesButton>
      )}
    </>
  );
}

interface IEditOrthographySettingsInner {
  language: ILanguage;
  orthSettings: IOrthographySettings;
}

function EditOrthographySettingsInner({ language, orthSettings }: IEditOrthographySettingsInner) {
  const [caseSensitive, setCaseSensitive] = useState(orthSettings.caseSensitive);

  const [settingsAreSaved, setSettingsAreSaved] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  return (
    <>
      <h2>Edit Orthography Settings</h2>
      <p>
        Edit <Link to={'/language/' + language.id}>{language.name}</Link>'s
        alphabetical order and other orthography settings.
      </p>
      <h3>Alphabetical Order</h3>
      {
        orthSettings.alphabeticalOrder.length > 0
        ? <EditAlphabeticalOrder
            language={language}
            orthSettings={orthSettings}
            caseSensitive={caseSensitive}
          />
        : <p>
            Please add graphs on the <Link to={'/phonology/' + language.id}>Edit Phonology
            page</Link> before editing {language.name}'s alphabetical order.
          </p>
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
            onChange={e => {
              setCaseSensitive(e.target.checked);
              setSettingsAreSaved(false);
            }}
          />
        </label>
      </div>
      {!settingsAreSaved && (
        <SaveChangesButton
          isSaving={isSavingSettings}
          setIsSaving={setIsSavingSettings}
          saveQueryKey={['languages', language.id, 'orth-settings', 'update']}
          saveQueryFn={async () => {
            return await sendSaveOrthSettingsRequest(caseSensitive, language.id);
          }}
          handleSave={() => setSettingsAreSaved(true)}
          style={{ marginTop: "1em" }}
        >
          Save
        </SaveChangesButton>
      )}
    </>
  );
}

export default function EditOrthographySettings() {
  const languageId = useGetParamsOrSelectedId();
  if(!languageId) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(languageId);
  const orthSettingsResponse = useLanguageOrthographySettings(languageId);

  useSetPageTitle("Edit Orthography Settings");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(orthSettingsResponse.status !== 'success') {
    return renderDatalessQueryResult(orthSettingsResponse);
  }

  return (
    <EditOrthographySettingsInner
      language={languageResponse.data}
      orthSettings={orthSettingsResponse.data}
    />
  );
}
