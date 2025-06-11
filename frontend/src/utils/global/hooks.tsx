import { useContext, useEffect } from 'react';
import { useBeforeUnload, useBlocker, useParams } from 'react-router-dom';

import SelectedLanguageContext from '@/contexts/SelectedLanguageContext';

export function useGetParamsOrSelectedId() {
  const paramsId = useParams().id;
  const selectedId = useContext(SelectedLanguageContext).selectedLanguage?.id;
  return paramsId ?? selectedId;
}

export function useScrollToHashOnLoad() {
  useEffect(() => {
    if(location.hash) {
      const element = document.querySelector(location.hash);
      if(element) {
        element.scrollIntoView();
      }
    }
  }, []);
}

export function useSetPageTitle(title: string) {
  useEffect(() => {
    document.title = title + " | Chronologue";
  }, [title]);
}

export function useUnsavedPopup(shouldShow: boolean) {
  useBeforeUnload(e => shouldShow && e.preventDefault());
  useBlocker(
    () => shouldShow && !window.confirm("Not all changes are saved. Leave anyway?")
  );
}
