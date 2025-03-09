import { Dispatch, ReactNode, SetStateAction } from 'react';
import { Form } from 'react-router-dom';

import LinkButton from '../components/LinkButton.tsx';

import { useEstimateWordIPAQuery } from '../phoneData.tsx';

export function CForm({ action, children }: { action: string, children: ReactNode }) {
  return (
    <Form method="post" action={action} className="chronologue-form">
      { children }
    </Form>
  )
};

export function CFormBody({ children }: { children: ReactNode }) {
  return (
    <table>
      <tbody>
        { children }
      </tbody>
    </table>
  );
};

interface ICCheckbox {
  label: ReactNode;
  labelColon?: boolean;
  name: string;
}

export function CCheckbox({ label, labelColon, name }: ICCheckbox) {
  return (
    <tr>
      <td>
        <label htmlFor={"ccb-" + name}>{label}{ (labelColon ?? true) && ":" }</label>
      </td>
      <td>
        <input type="checkbox" name={name} id={"ccb-" + name} />
      </td>
    </tr>
  );
};

interface IIpaTextInput {
  languageId: string;
  ipa: string;
  setIpa: Dispatch<SetStateAction<string>>;
  word: string;
}

function IpaEstimationText({ languageId, setIpa, word }: IIpaTextInput) {
  const query = useEstimateWordIPAQuery(languageId, word, word.length > 0);

  if(query.status === 'pending') {
    return <small>Estimating IPA...</small>;
  } else if(query.status === 'error') {
    return <small>Could not estimate IPA: { query.error.message }</small>;
  } else {
    return (
      <small>
        [{ query.data }]{" "}
        <LinkButton onClick={ () => setIpa(query.data) }>[fill]</LinkButton>
      </small>
    );
  }
}

export function CIpaTextInput({ languageId, ipa, setIpa, word }: IIpaTextInput) {
  return (
    <tr>
      <td>
        <label htmlFor="cti-ipa">IPA:</label>
      </td>
      <td>
        <input
          type="text"
          name="ipa"
          id="cti-ipa"
          value={ipa}
          onChange={ e => setIpa(e.target.value) }
        />
        {
          word && (
            <>
              <br />
              <IpaEstimationText
                languageId={languageId}
                ipa={ipa}
                setIpa={setIpa}
                word={word}
              />
            </>
          )
        }
      </td>
    </tr>
  );
};

interface ITextInput {
  label: ReactNode;
  name: string;
  state?: string;
  setState?: Dispatch<SetStateAction<string>>;
}

export function CMultilineTextInput({ label, name, state, setState }: ITextInput) {
  return (
    <tr>
      <td>
        <label htmlFor={"cmti-" + name} className="textarea-label">{label}:</label>
      </td>
      <td className="textarea-parent">
        <textarea
          name={name}
          id={"cmti-" + name}
          value={state}
          onChange={ setState && (e => setState(e.target.value)) }
        ></textarea>
      </td>
    </tr>
  );
};

interface ICSelect {
  label: ReactNode;
  name: string;
  children: ReactNode;
  state?: string;
  setState?: (value: string) => void; // Dispatch<SetStateAction<string>>;
}

export function CSelect({ label, name, children, state, setState }: ICSelect) {
  return (
    <tr>
      <td>
        <label htmlFor={"cs-" + name}>{label}:</label>
      </td>
      <td>
        <select
          name={name}
          id={"cs-" + name}
          value={state}
          onChange={ setState && (e => setState(e.target.value)) }
        >
          { children }
        </select>
      </td>
    </tr>
  );
};

export function CTextInput({ label, name, state, setState }: ITextInput) {
  return (
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
          onChange={ setState && (e => setState(e.target.value)) }
        />
      </td>
    </tr>
  );
};
