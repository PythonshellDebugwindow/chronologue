import { createContext } from 'react';

export interface ISelectedLanguageData {
  id: string;
  name: string;
};

interface ISLObject {
  selectedLanguage: ISelectedLanguageData | null,
  setSelectedLanguage: (_: ISelectedLanguageData | null) => void
}

function loadSelectedLanguageFromStorage() {
  const id = localStorage.getItem('sl-id');
  const name = localStorage.getItem('sl-name');
  return id && name !== null ? { id, name } : null;
}

export function saveSelectedLanguageToStorage(sl: ISelectedLanguageData | null) {
  if(sl) {
    localStorage.setItem('sl-id', sl.id);
    localStorage.setItem('sl-name', sl.name);
  } else {
    localStorage.removeItem('sl-id');
    localStorage.removeItem('sl-name');
  }
};

const slObject: ISLObject = {
  selectedLanguage: loadSelectedLanguageFromStorage(),
  setSelectedLanguage: (_: ISelectedLanguageData | null) => {}
};

const SelectedLanguageContext = createContext(slObject);

export default SelectedLanguageContext;
