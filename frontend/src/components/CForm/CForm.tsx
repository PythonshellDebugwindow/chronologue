import { Dispatch, ReactNode, SetStateAction, useEffect, useState } from 'react';
import { Form } from 'react-router-dom';

import LinkButton from '../LinkButton';

import { useEstimateWordIPAQuery } from '@/hooks/phones';

import styles from './CForm.module.css';

export function CForm({ action, children }: { action?: string, children: ReactNode }) {
  return (
    <Form
      method={action ? "post" : undefined}
      action={action}
      className={styles.cform}
    >
      {children}
    </Form>
  );
}

export function CFormBody({ children }: { children: ReactNode }) {
  return (
    <table>
      <tbody>
        {children}
      </tbody>
    </table>
  );
}

interface ICCheckbox {
  label: ReactNode;
  labelColon?: boolean;
  name: string;
  state?: boolean;
  setState?: Dispatch<SetStateAction<boolean>>;
}

export function CCheckbox({ label, labelColon, name, state, setState }: ICCheckbox) {
  return (
    <tr>
      <td>
        <label htmlFor={"ccb-" + name}>{label}{labelColon && ":"}</label>
      </td>
      <td>
        <input
          type="checkbox"
          name={name}
          id={"ccb-" + name}
          checked={state}
          onChange={setState && (e => setState(e.target.checked))}
        />
      </td>
    </tr>
  );
}

interface IIpaTextInput {
  languageId: string;
  ipa: string;
  setIpa: Dispatch<SetStateAction<string>>;
  word: string;
}

function IpaEstimationText({ languageId, setIpa, word }: IIpaTextInput) {
  const query = useEstimateWordIPAQuery(languageId, word, word.length > 0);
  const [estimation, setEstimation] = useState("");

  useEffect(() => {
    if(query.data && estimation !== query.data) {
      setEstimation(query.data);
    }
  }, [estimation, query]);

  if(estimation) {
    return (
      <small>
        [{estimation}]{" "}
        <LinkButton onClick={() => setIpa(estimation)}>[fill]</LinkButton>
      </small>
    );
  } else if(query.status === 'pending') {
    return <small>Estimating IPA...</small>;
  } else if(query.status === 'error') {
    return <small>Could not estimate IPA: {query.error.message}</small>;
  } else {
    return <small>Could not estimate IPA</small>;
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
          onChange={e => setIpa(e.target.value)}
        />
        {word && (
          <>
            <br />
            <IpaEstimationText
              languageId={languageId}
              ipa={ipa}
              setIpa={setIpa}
              word={word}
            />
          </>
        )}
      </td>
    </tr>
  );
}

interface ITextInput {
  label: ReactNode;
  name: string;
  state?: string;
  setState?: Dispatch<SetStateAction<string>>;
  width?: string;
  height?: string;
}

export function CMultilineTextInput({ label, name, state, setState, height }: ITextInput) {
  return (
    <tr>
      <td>
        <label
          htmlFor={"cmti-" + name}
          className={styles.textareaLabel}
        >
          {label}:
        </label>
      </td>
      <td className={styles.textareaParent}>
        <textarea
          name={name}
          id={"cmti-" + name}
          value={state}
          onChange={setState && (e => setState(e.target.value))}
          style={height ? { height } : undefined}
        />
      </td>
    </tr>
  );
}

interface ICSelect {
  label: ReactNode;
  name: string;
  children: ReactNode;
  state?: string;
  setState?: (value: string) => void;
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
          onChange={setState && (e => setState(e.target.value))}
        >
          {children}
        </select>
      </td>
    </tr>
  );
}

export function CTextInput({ label, name, state, setState, width }: ITextInput) {
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
          onChange={setState && (e => setState(e.target.value))}
          style={width ? { width } : undefined}
        />
      </td>
    </tr>
  );
}
