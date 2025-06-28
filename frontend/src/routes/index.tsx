import { createBrowserRouter } from 'react-router-dom';

import Header from '@/components/Header';

import ErrorPage from './ErrorPage';
import MainPage from './MainPage';

import AddArticle from './articles/AddArticle';
import DeleteArticle from './articles/DeleteArticle';
import EditArticle from './articles/EditArticle';
import EditArticleFolders from './articles/EditArticleFolders';
import ViewArticle from './articles/ViewArticle';
import ViewArticles from './articles/ViewArticles';

import ChronoSCAHelpPage from './chronosca/ChronoSCAHelpPage';
import EditDerivationRules from './chronosca/EditDerivationRules';
import TestChronoSCA from './chronosca/TestChronoSCA';

import EditDictionarySettings from './dictionary/EditDictionarySettings';
import ImportWords from './dictionary/ImportWords';
import MassEditDictionary from './dictionary/MassEditDictionary';
import PurgeDictionary from './dictionary/PurgeDictionary';
import RunDictionarySCA from './dictionary/RunDictionarySCA';
import ViewDictionary from './dictionary/ViewDictionary';

import AddFamily, {
  action as addFamilyAction
} from './families/AddFamily';
import DeleteFamily from './families/DeleteFamily';
import EditFamily from './families/EditFamily';
import ViewFamily from './families/ViewFamily';

import AddGrammarTable from './grammar/AddGrammarTable';
import DeleteGrammarTable from './grammar/DeleteGrammarTable';
import EditGrammarForms from './grammar/EditGrammarForms';
import EditGrammarTable from './grammar/EditGrammarTable';
import EditStems from './grammar/EditStems';
import ViewGrammarTable from './grammar/ViewGrammarTable';
import ViewGrammarTables from './grammar/ViewGrammarTables';

import AddLanguage, {
  action as addLanguageAction
} from './languages/AddLanguage';
import DeleteLanguage from './languages/DeleteLanguage';
import EditLanguage from './languages/EditLanguage';
import EditSummaryNotes from './languages/EditSummaryNotes';
import ViewLanguage from './languages/ViewLanguage';
import ViewLanguages from './languages/ViewLanguages';

import EditOrthographySettings from './phones/EditOrthographySettings';
import EditPhoneAndOrthCategories from './phones/EditPhoneAndOrthCategories';
import EditPhonology from './phones/EditPhonology';
import EditPronunciationEstimation from './phones/EditPronunciationEstimation';

import AddTranslation from './translations/AddTranslation';
import DeleteTextTranslation from './translations/DeleteTextTranslation';
import DeleteTranslation from './translations/DeleteTranslation';
import EditTranslation from './translations/EditTranslation';
import TranslateText from './translations/TranslateText';
import ViewLanguageTranslations from './translations/ViewLanguageTranslations';
import ViewTranslation from './translations/ViewTranslation';
import ViewTranslations from './translations/ViewTranslations';

import AddWord from './words/AddWord';
import DefineIrregularForms from './words/DefineIrregularForms';
import DeleteWord from './words/DeleteWord';
import EditWord from './words/EditWord';
import ViewWord from './words/ViewWord';

export const appRouter = createBrowserRouter([
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
        path: "add-article",
        element: <AddArticle />
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
        path: "add-translation",
        element: <AddTranslation />
      },
      {
        path: "add-word/:id?",
        element: <AddWord />
      },
      {
        path: "article/:id?",
        element: <ViewArticle />
      },
      {
        path: "article-folders",
        element: <EditArticleFolders />
      },
      {
        path: "articles",
        element: <ViewArticles />
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
        path: "delete-article/:id",
        element: <DeleteArticle />
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
        path: "delete-text-translation/:id",
        element: <DeleteTextTranslation />
      },
      {
        path: "delete-translation/:id",
        element: <DeleteTranslation />
      },
      {
        path: "delete-word/:id",
        element: <DeleteWord />
      },
      {
        path: "derivation-rules",
        element: <EditDerivationRules />
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
        path: "edit-article/:id",
        element: <EditArticle />
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
        path: "edit-translation/:id",
        element: <EditTranslation />
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
        path: "language-translations/:id?",
        element: <ViewLanguageTranslations />
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
        path: "translate-text/:id",
        element: <TranslateText />
      },
      {
        path: "translation/:id",
        element: <ViewTranslation />
      },
      {
        path: "translations",
        element: <ViewTranslations />
      },
      {
        path: "word/:id",
        element: <ViewWord />
      }
    ]
  }
]);
