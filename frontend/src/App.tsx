import { useContext, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './App.css';

import Header from './components/Header.tsx';

import AddFamily, {
  action as addFamilyAction
} from './routes/AddFamily.tsx';
import AddGrammarTable from './routes/AddGrammarTable.tsx';
import AddLanguage, {
  action as addLanguageAction
} from './routes/AddLanguage.tsx';
import AddWord from './routes/AddWord.tsx';
import DeleteFamily from './routes/DeleteFamily.tsx';
import DeleteLanguage from './routes/DeleteLanguage.tsx';
import DeleteWord from './routes/DeleteWord.tsx';
import ChronoSCAHelpPage from './routes/ChronoSCAHelpPage.tsx';
import DefineIrregularForms from './routes/DefineIrregularForms.tsx';
import DeleteGrammarTable from './routes/DeleteGrammarTable.tsx';
import EditDictionarySettings from './routes/EditDictionarySettings.tsx';
import EditFamily from './routes/EditFamily.tsx';
import EditGrammarForms from './routes/EditGrammarForms.tsx';
import EditGrammarTable from './routes/EditGrammarTable.tsx';
import EditLanguage from './routes/EditLanguage.tsx';
import EditOrthographySettings from './routes/EditOrthographySettings.tsx';
import EditPhoneAndOrthCategories from './routes/EditPhoneAndOrthCategories.tsx';
import EditPhonology from './routes/EditPhonology.tsx';
import EditPronunciationEstimation from './routes/EditPronunciationEstimation.tsx';
import EditStems from './routes/EditStems.tsx';
import EditSummaryNotes from './routes/EditSummaryNotes.tsx';
import EditWord from './routes/EditWord.tsx';
import ErrorPage from './routes/ErrorPage.tsx';
import ImportWords from './routes/ImportWords.tsx';
import MainPage from './routes/MainPage.tsx';
import MassEditDictionary from './routes/MassEditDictionary.tsx';
import PurgeDictionary from './routes/PurgeDictionary.tsx';
import RunDictionarySCA from './routes/RunDictionarySCA.tsx';
import TestChronoSCA from './routes/TestChronoSCA.tsx';
import ViewDictionary from './routes/ViewDictionary.tsx';
import ViewFamily from './routes/ViewFamily.tsx';
import ViewGrammarTable from './routes/ViewGrammarTable.tsx';
import ViewGrammarTables from './routes/ViewGrammarTables.tsx';
import ViewLanguage from './routes/ViewLanguage.tsx';
import ViewLanguages from './routes/ViewLanguages.tsx';
import ViewWord from './routes/ViewWord.tsx';

import SelectedLanguageContext, {
  ISelectedLanguageData, saveSelectedLanguageToStorage
} from './SelectedLanguageContext.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Header />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <MainPage />
      },
      {
        path: "add-family",
        element: <AddFamily />,
        action: addFamilyAction
      },
      {
        path: "add-grammar-table/:id?",
        element: <AddGrammarTable />
      },
      {
        path: "add-language",
        element: <AddLanguage />,
        action: addLanguageAction
      },
      {
        path: "add-word/:id?",
        element: <AddWord />
      },
      {
        path: "chronosca/:id?",
        element: <TestChronoSCA />
      },
      {
        path: "chronosca-help",
        element: <ChronoSCAHelpPage />
      },
      {
        path: "delete-family/:id",
        element: <DeleteFamily />
      },
      {
        path: "delete-grammar-table/:id",
        element: <DeleteGrammarTable />
      },
      {
        path: "delete-language/:id",
        element: <DeleteLanguage />
      },
      {
        path: "delete-word/:id",
        element: <DeleteWord />
      },
      {
        path: "dictionary/:id?",
        element: <ViewDictionary />
      },
      {
        path: "dictionary-chronosca/:id?",
        element: <RunDictionarySCA />
      },
      {
        path: "dictionary-settings/:id?",
        element: <EditDictionarySettings />
      },
      {
        path: "edit-categories/:id?",
        element: <EditPhoneAndOrthCategories />
      },
      {
        path: "edit-family/:id",
        element: <EditFamily />
      },
      {
        path: "edit-grammar-table/:id",
        element: <EditGrammarTable />
      },
      {
        path: "edit-language/:id?",
        element: <EditLanguage />
      },
      {
        path: "edit-stems/:id?",
        element: <EditStems />
      },
      {
        path: "edit-word/:id",
        element: <EditWord />
      },
      {
        path: "estimate-ipa/:id?",
        element: <EditPronunciationEstimation />
      },
      {
        path: "family/:id",
        element: <ViewFamily />
      },
      {
        path: "grammar-forms",
        element: <EditGrammarForms />
      },
      {
        path: "grammar-table/:id",
        element: <ViewGrammarTable />
      },
      {
        path: "grammar-tables/:id?",
        element: <ViewGrammarTables />
      },
      {
        path: "import-words/:id?",
        element: <ImportWords />
      },
      {
        path: "irregular-forms/:id?",
        element: <DefineIrregularForms />
      },
      {
        path: "language/:id?",
        element: <ViewLanguage />
      },
      {
        path: "languages",
        element: <ViewLanguages />
      },
      {
        path: "mass-edit-dictionary/:id?",
        element: <MassEditDictionary />
      },
      {
        path: "orthography-settings/:id?",
        element: <EditOrthographySettings />
      },
      {
        path: "phonology/:id?",
        element: <EditPhonology />
      },
      {
        path: "purge-dictionary/:id?",
        element: <PurgeDictionary />
      },
      {
        path: "summary-notes/:id?",
        element: <EditSummaryNotes />
      },
      {
        path: "word/:id",
        element: <ViewWord />
      }
    ]
  }
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
      gcTime: 0,
      refetchOnWindowFocus: false
    }
  }
});

export default function App() {
  const initialSL = useContext(SelectedLanguageContext).selectedLanguage;
  const [selectedLanguage, setSLState] = useState(initialSL);

  function setSelectedLanguage(languageData: ISelectedLanguageData | null) {
    setSLState(languageData);
    saveSelectedLanguageToStorage(languageData);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SelectedLanguageContext.Provider value={{ selectedLanguage, setSelectedLanguage }}>
        <RouterProvider router={router} />
      </SelectedLanguageContext.Provider>
    </QueryClientProvider>
  );
};
