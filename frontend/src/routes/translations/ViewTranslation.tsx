import { useContext } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import DisplayDate from '@/components/DisplayDate';
import InfoTable from '@/components/InfoTable';
import LanguageLink from '@/components/LanguageLink';
import {
  LanguageTranslationDateAndLinks,
  TranslationContent,
  TranslationDropdowns,
  TranslationInfo,
  TranslationLanguagesTable,
  TranslationRow,
  TranslationWIPText
} from '@/components/Translations';

import SelectedLanguageContext, {
  ISelectedLanguageData
} from '@/contexts/SelectedLanguageContext';

import { useGrammarForms } from '@/hooks/grammar';
import { useLanguage } from '@/hooks/languages';
import {
  useLanguageTranslation,
  useTranslation,
  useTranslationLanguages
} from '@/hooks/translations';

import { IGrammarForm } from '@/types/grammar';
import { ILanguageTranslation, ITranslation } from '@/types/translations';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

interface ILanguageTranslationRow {
  languageTranslation: ILanguageTranslation;
  translationId: string;
  grammarForms: IGrammarForm[];
}

function LanguageTranslationRow(
  { languageTranslation: langTr, translationId, grammarForms }: ILanguageTranslationRow
) {
  return (
    <TranslationRow workInProgress={langTr.workInProgress}>
      <td>
        <LanguageLink id={langTr.langId} />
      </td>
      <td>
        <LanguageTranslationDateAndLinks
          created={langTr.created}
          translationId={translationId}
          languageId={langTr.langId}
        />
        {langTr.workInProgress && <TranslationWIPText />}
        <TranslationContent>{langTr.content}</TranslationContent>
        <TranslationDropdowns
          languageTranslation={langTr}
          grammarForms={grammarForms}
        />
      </td>
    </TranslationRow>
  );
}

interface ISingleLanguageTranslation {
  translation: ITranslation;
  languageId: string;
  grammarForms: IGrammarForm[];
}

function SingleLanguageTranslation(
  { translation, languageId, grammarForms }: ISingleLanguageTranslation
) {
  const languageResponse = useLanguage(languageId);
  const langTrResponse = useLanguageTranslation(languageId, translation.id);

  if(languageResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(languageResponse.status === 'error') {
    return <p>Error: {languageResponse.error.message}</p>;
  }

  if(langTrResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(langTrResponse.status === 'error') {
    return <p>Error: {langTrResponse.error.message}</p>;
  }

  const languageName = languageResponse.data.name;
  const langTr = langTrResponse.data;

  return (
    <>
      <p>Viewing translation into {languageName}.</p>
      <p style={{ marginBottom: "0" }}>
        <Link to={'/translation/' + translation.id}>View all translated languages</Link>
      </p>
      {langTr && (
        <TranslationLanguagesTable>
          <LanguageTranslationRow
            languageTranslation={langTr}
            translationId={translation.id}
            grammarForms={grammarForms}
          />
        </TranslationLanguagesTable>
      )}
      {!langTr && (
        <>
          <p>
            You have not yet translated this text into{" "}
            <Link to={'/language/' + languageId}>{languageName}</Link>.
          </p>
          <p>
            <Link to={`/translate-text/${translation.id}?lang=${languageId}`}>
              Translate to {languageName}
            </Link>
          </p>
        </>
      )}
    </>
  );
}

interface IAllLanguageTranslations {
  translation: ITranslation;
  selectedLanguage: ISelectedLanguageData | null;
  grammarForms: IGrammarForm[];
}

function AllLanguageTranslations(
  { translation, selectedLanguage, grammarForms }: IAllLanguageTranslations
) {
  const languagesResponse = useTranslationLanguages(translation.id);

  if(languagesResponse.status === 'pending') {
    return <p>Loading...</p>;
  } else if(languagesResponse.status === 'error') {
    return <p>Error: {languagesResponse.error.message}</p>;
  }

  const languageTranslations = languagesResponse.data;

  return (
    <>
      {selectedLanguage && (
        !languageTranslations.some(langTr => langTr.langId === selectedLanguage.id) && (
          <p style={{ marginBottom: "0" }}>
            <Link to={'/translate-text/' + translation.id}>
              Translate to {selectedLanguage.name}
            </Link>
          </p>
        )
      )}
      {languageTranslations.length > 0 && (
        <TranslationLanguagesTable>
          {languageTranslations.map(langTr => (
            <LanguageTranslationRow
              languageTranslation={langTr}
              translationId={translation.id}
              grammarForms={grammarForms}
              key={langTr.langId}
            />
          ))}
        </TranslationLanguagesTable>
      )}
      {languageTranslations.length === 0 && (
        <p>You have not yet translated this text into any languages.</p>
      )}
    </>
  );
}

interface IViewTranslationInner {
  translation: ITranslation;
  selectedLanguage: ISelectedLanguageData | null;
  showingLanguageId: string | null;
  grammarForms: IGrammarForm[];
}

function ViewTranslationInner(
  { translation, selectedLanguage, showingLanguageId, grammarForms }: IViewTranslationInner
) {
  return (
    <div>
      <h2>View Translation</h2>
      <InfoTable>
        <tr>
          <th>Created:</th>
          <td>
            <DisplayDate date={translation.created} />
          </td>
        </tr>
      </InfoTable>
      <TranslationInfo>
        <h4>Text:</h4>
        <p>{translation.content}</p>
      </TranslationInfo>
      {translation.notes && (
        <TranslationInfo small>
          <h4>Notes:</h4>
          <p>{translation.notes}</p>
        </TranslationInfo>
      )}
      <p><Link to={'/edit-translation/' + translation.id}>Edit translation</Link></p>
      <h3>Languages</h3>
      {showingLanguageId && (
        <SingleLanguageTranslation
          translation={translation}
          languageId={showingLanguageId}
          grammarForms={grammarForms}
        />
      )}
      {!showingLanguageId && (
        <AllLanguageTranslations
          translation={translation}
          selectedLanguage={selectedLanguage}
          grammarForms={grammarForms}
        />
      )}
    </div>
  );
}

export default function ViewTranslation() {
  const { id } = useParams();
  if(!id) {
    throw new Error("No translation ID was provided");
  }

  const [searchParams] = useSearchParams();
  const showingLanguageId = searchParams.get('lang');

  const translationResponse = useTranslation(id);
  const grammarFormsResponse = useGrammarForms();

  const { selectedLanguage } = useContext(SelectedLanguageContext);

  useSetPageTitle("View Translation");

  if(translationResponse.status !== 'success') {
    return renderDatalessQueryResult(translationResponse);
  }

  if(grammarFormsResponse.status !== 'success') {
    return renderDatalessQueryResult(grammarFormsResponse);
  }

  return (
    <ViewTranslationInner
      translation={translationResponse.data}
      selectedLanguage={selectedLanguage}
      showingLanguageId={showingLanguageId}
      grammarForms={grammarFormsResponse.data}
    />
  );
}
