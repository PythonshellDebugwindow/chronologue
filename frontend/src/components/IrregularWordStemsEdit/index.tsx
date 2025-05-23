import { Dispatch, SetStateAction, useEffect } from 'react';

import { useIrregularWordStems, useLanguageWordStemsByPOS } from '@/hooks/grammar';

import { IrregularWordStems } from '@/types/grammar';

interface IIrregularStemsEditInner {
  langId: string;
  pos: string;
  irregularStems: IrregularWordStems | null;
  setIrregularStems: Dispatch<SetStateAction<IrregularWordStems | null>>;
}

function IrregularStemsEditInner(
  { langId, pos, irregularStems, setIrregularStems }: IIrregularStemsEditInner
) {
  const posStemsQuery = useLanguageWordStemsByPOS(langId, pos);

  if(posStemsQuery.status === 'error') {
    return <p>Error loading stems: {posStemsQuery.error.message}</p>;
  } else if(posStemsQuery.status === 'pending') {
    return <p>Loading stems...</p>;
  }

  if(posStemsQuery.data.length === 0) {
    return null;
  }

  return (
    <>
      <h4 style={{ textAlign: "center", margin: "10px 0" }}>
        Irregular Stems
      </h4>
      <table className="settings-table">
        <tbody>
          {posStemsQuery.data.map(stem => (
            <tr key={stem.id}>
              <td>{stem.name}</td>
              <td>
                <input
                  value={irregularStems?.[stem.id] ?? ""}
                  onChange={e => {
                    setIrregularStems({ ...irregularStems, [stem.id]: e.target.value });
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

interface IIrregularWordStemsEdit {
  wordId?: string;
  langId: string;
  pos: string;
  irregularStems: IrregularWordStems | null;
  setIrregularStems: Dispatch<SetStateAction<IrregularWordStems | null>>;
}

type IIrregularStemsEditWithWord = IIrregularWordStemsEdit & {
  wordId: string;
};

function IrregularStemsEditWithWord(
  { wordId, langId, pos, irregularStems, setIrregularStems }: IIrregularStemsEditWithWord
) {
  const irregularStemsQuery = useIrregularWordStems(wordId);

  useEffect(() => {
    if(irregularStemsQuery.data && irregularStems === null) {
      setIrregularStems(irregularStemsQuery.data);
    }
  }, [irregularStems, irregularStemsQuery, setIrregularStems]);

  if(irregularStemsQuery.status === 'error') {
    return <p>Error loading stems: {irregularStemsQuery.error.message}</p>;
  } else if(irregularStemsQuery.status === 'pending') {
    return <p>Loading stems...</p>;
  }

  return (
    <IrregularStemsEditInner
      pos={pos}
      langId={langId}
      irregularStems={irregularStems}
      setIrregularStems={setIrregularStems}
    />
  );
}

export default function IrregularWordStemsEdit(
  { wordId = undefined, langId, pos, irregularStems, setIrregularStems }: IIrregularWordStemsEdit
) {
  if(wordId) {
    return (
      <IrregularStemsEditWithWord
        wordId={wordId}
        langId={langId}
        pos={pos}
        irregularStems={irregularStems}
        setIrregularStems={setIrregularStems}
      />
    );
  } else {
    return (
      <IrregularStemsEditInner
        langId={langId}
        pos={pos}
        irregularStems={irregularStems}
        setIrregularStems={setIrregularStems}
      />
    );
  }
}
