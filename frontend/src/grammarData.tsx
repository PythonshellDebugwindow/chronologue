import { useQuery } from '@tanstack/react-query';

import { ITitledError, getBackendJson } from './utils.tsx';

export interface IGrammarForm {
  id: string;
  code: string;
  name: string;
};

export function getGrammarForms() {
  return useQuery<IGrammarForm[], ITitledError>({
    queryKey: ['grammar-forms'],
    queryFn: async () => await getBackendJson('grammar-forms')
  });
};
