import { CSSProperties, Dispatch, ReactNode, SetStateAction, useEffect } from 'react';
import { QueryKey, useQuery, useQueryClient } from '@tanstack/react-query';

import { ITitledError } from '@/types/titledError';

interface ISaveChangesButton<SaveQueryData> {
  isSaving: boolean;
  setIsSaving: Dispatch<SetStateAction<boolean>>;
  saveQueryKey: QueryKey;
  saveQueryFn: () => Promise<SaveQueryData>;
  handleSave: (data: SaveQueryData) => void;
  style?: CSSProperties;
  children: ReactNode;
}

export default function SaveChangesButton<SaveQueryData>({
  isSaving, setIsSaving, saveQueryKey, saveQueryFn, handleSave, style = {}, children
}: ISaveChangesButton<SaveQueryData>) {
  const queryClient = useQueryClient();

  const saveQuery = useQuery<SaveQueryData, ITitledError>({
    queryKey: saveQueryKey,
    queryFn: saveQueryFn,
    enabled: isSaving,
    refetchOnWindowFocus: false
  });

  const disableButtons = isSaving && saveQuery.error === null;

  useEffect(() => {
    if(isSaving && saveQuery.status === 'success') {
      handleSave(saveQuery.data);
      setIsSaving(false);
    }
  }, [isSaving, saveQuery, handleSave, setIsSaving]);

  function saveChanges() {
    queryClient.resetQueries({ queryKey: saveQueryKey });
    setIsSaving(true);
  }

  return (
    <div style={style}>
      <button disabled={disableButtons} onClick={saveChanges}>
        {children}
      </button>
      {isSaving && (
        <p style={{ margin: "0.4em 0 0" }}>
          {
            saveQuery.isPending
              ? "Saving..."
              : (saveQuery.error && <b>Could not save: {saveQuery.error.message}</b>)
          }
        </p>
      )}
    </div>
  );
}
