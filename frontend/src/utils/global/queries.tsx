import { UseQueryResult } from '@tanstack/react-query';

import { ITitledError } from '@/types/titledError';

interface IFormData {
  [key: string]: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export async function getFormJson(request: Request) {
  const formData = await request.formData();

  const formJson: IFormData = {};
  for(const [key, value] of [...formData.entries()]) {
    if(typeof value === 'string') {
      formJson[key] = value;
    }
  }

  return formJson;
}

export async function sendBackendJson(
  url: string, method: 'POST' | 'PUT', requestBody: { [key: string]: any }
) {
  try {
    const response = await fetch(BACKEND_URL + url, {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    const json = response.status !== 204 ? await response.json() : null;
    return { status: response.status, ok: response.ok, body: json };
  } catch(err) {
    const json = { message: (err as Error).message };
    return { status: 0, ok: false, body: json };
  }
}

export async function sendBackendJsonForQuery(
  url: string, method: 'POST' | 'PUT', requestBody: { [key: string]: any }
) {
  const response = await fetch(BACKEND_URL + url, {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  const json = response.status !== 204 ? await response.json() : null;
  if(!response.ok) {
    throw json;
  }
  return json;
}

export async function sendBackendRequest(url: string, method: 'DELETE') {
  try {
    const response = await fetch(BACKEND_URL + url, {
      method,
      headers: {
        'Accept': 'application/json'
      }
    });
    const json = response.status !== 204 ? await response.json() : null;
    return { status: response.status, ok: response.ok, body: json };
  } catch(err) {
    if(err instanceof TypeError) {
      return { status: 0, ok: false, body: { message: err.message } };
    } else {
      throw err;
    }
  }
}

export async function getBackendJson(url: string) {
  const response = await fetch(BACKEND_URL + url);
  const json = await response.json();
  if(!response.ok) {
    throw json;
  }
  return json;
}

export function parseRecordDates(rows: { [key: string]: any }[]): any[] {
  rows.forEach(parseSingleRecordDates);
  return rows;
}

export function parseSingleRecordDates(row: { [key: string]: any }): any {
  row.created = new Date(row.created);
  if(row.updated) {
    row.updated = new Date(row.updated);
  }
  return row;
}

type DatalessQueryResult<T> = UseQueryResult<T, ITitledError> & {
  status: 'error' | 'pending';
};

export function renderDatalessQueryResult<T>(query: DatalessQueryResult<T>) {
  if(query.status === 'error') {
    return (
      <>
        <h2>{query.error.title ?? "Error"}</h2>
        <p>{query.error.message}</p>
      </>
    );
  } else {
    return <p>Loading...</p>;
  }
}
