import { useContext, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import './App.css';

import Header from './components/Header.tsx';

import AddFamily, {
  action as addFamilyAction
} from './routes/AddFamily.tsx';
import AddLanguage, {
  action as addLanguageAction
} from './routes/AddLanguage.tsx';
import AddWord from './routes/AddWord.tsx';
import DeleteFamily from './routes/DeleteFamily.tsx';
import DeleteLanguage from './routes/DeleteLanguage.tsx';
import DeleteWord from './routes/DeleteWord.tsx';
import EditAlphabeticalOrder from './routes/EditAlphabeticalOrder.tsx';
import EditDictionarySettings from './routes/EditDictionarySettings.tsx';
import EditFamily from './routes/EditFamily.tsx';
import EditGrammarForms from './routes/EditGrammarForms.tsx';
import EditLanguage from './routes/EditLanguage.tsx';
import EditPhoneAndOrthCategories from './routes/EditPhoneAndOrthCategories.tsx';
import EditPhonology from './routes/EditPhonology.tsx';
import EditPronunciationEstimation from './routes/EditPronunciationEstimation.tsx';
import EditSummaryNotes from './routes/EditSummaryNotes.tsx';
import EditWord from './routes/EditWord.tsx';
import ErrorPage from './routes/ErrorPage.tsx';
import MainPage from './routes/MainPage.tsx';
import ViewDictionary from './routes/ViewDictionary.tsx';
import ViewFamily from './routes/ViewFamily.tsx';
import ViewLanguage from './routes/ViewLanguage.tsx';
import ViewLanguages from './routes/ViewLanguages.tsx';
import ViewWord from './routes/ViewWord.tsx';

import SelectedLanguageContext, { ISelectedLanguageData, saveSelectedLanguageToStorage } from './SelectedLanguageContext.tsx';

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
        path: "add-language",
        element: <AddLanguage />,
        action: addLanguageAction
      },
      {
        path: "add-word/:id?",
        element: <AddWord />
      },
      {
        path: "alphabetical-order/:id?",
        element: <EditAlphabeticalOrder />
      },
      {
        path: "delete-family/:id",
        element: <DeleteFamily />
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
        path: "edit-language/:id?",
        element: <EditLanguage />
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
        path: "language/:id?",
        element: <ViewLanguage />
      },
      {
        path: "languages",
        element: <ViewLanguages />
      },
      {
        path: "phonology/:id?",
        element: <EditPhonology />
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

export default function App() {
  const initialSL = useContext(SelectedLanguageContext).selectedLanguage;
  const [selectedLanguage, setSLState] = useState(initialSL);
  
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: 0
      }
    }
  });
  
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
