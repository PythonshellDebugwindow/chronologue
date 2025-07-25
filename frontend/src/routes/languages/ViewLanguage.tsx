import { useContext } from 'react';
import { Link } from 'react-router-dom';

import DisplayDate from '@/components/DisplayDate';
import FamilyLink from '@/components/FamilyLink';
import InfoTable from '@/components/InfoTable';
import LanguageLink from '@/components/LanguageLink';
import { LanguageTree } from '@/components/LanguageTree';
import LinkButton from '@/components/LinkButton';
import { UserNotesParagraph } from '@/components/Paragraphs';
import { OrthographySection } from '@/components/ViewLanguageOrthography';
import { PhonologySection } from '@/components/ViewLanguagePhonology';

import SelectedLanguageContext from '@/contexts/SelectedLanguageContext';

import { useLanguage, useLanguageSummaryNotes } from '@/hooks/languages';
import { useLanguageWordCount } from '@/hooks/words';

import { ILanguage, ILanguageSummaryNotes } from '@/types/languages';

import { useGetParamsOrSelectedId, useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

import { formatLanguageStatus } from '@/utils/languages';

function useWordCount(id: string) {
  const { isPending, error, data } = useLanguageWordCount(id);
  if(isPending) {
    return "Loading...";
  } else if(error) {
    return error.message;
  } else {
    return data;
  }
}

interface IViewLanguageInner {
  language: ILanguage;
  summaryNotes: ILanguageSummaryNotes;
}

function ViewLanguageInner({ language, summaryNotes }: IViewLanguageInner) {
  const { selectedLanguage, setSelectedLanguage } = useContext(SelectedLanguageContext);

  return (
    <>
      <h2>View Language: {language.name}</h2>
      {language.id !== selectedLanguage?.id && (
        <p>
          <LinkButton onClick={() => setSelectedLanguage(language)}>
            Select
          </LinkButton>
        </p>
      )}
      <InfoTable>
        {language.autonym && (
          <tr>
            <th>Autonym:</th>
            <td>{language.autonym}</td>
          </tr>
        )}
        <tr>
          <th>Family:</th>
          <td>
            {
              language.familyId !== null
                ? <FamilyLink id={language.familyId} />
                : "None"
            }
          </td>
        </tr>
        {language.parentId !== null && (
          <tr>
            <th>Parent:</th>
            <td>
              <LanguageLink id={language.parentId} />
            </td>
          </tr>
        )}
        <tr>
          <th>Created:</th>
          <td>
            <DisplayDate date={language.created} />
          </td>
        </tr>
        <tr>
          <th>Status:</th>
          <td>
            {formatLanguageStatus(language.status)}
          </td>
        </tr>
        {language.era && (
          <tr>
            <th>Era:</th>
            <td>{language.era}</td>
          </tr>
        )}
        <tr>
          <th>Words:</th>
          <td>
            {useWordCount(language.id)}
          </td>
        </tr>
      </InfoTable>
      {summaryNotes.description && (
        <UserNotesParagraph>
          {summaryNotes.description}
        </UserNotesParagraph>
      )}
      <p><Link to={'/edit-language/' + language.id}>Edit language</Link></p>
      <LanguageTree root={language} />
      <h3>Dictionary</h3>
      <p><Link to={'/dictionary/' + language.id}>View dictionary</Link></p>
      <PhonologySection
        languageId={language.id}
        notes={summaryNotes.phonologyNotes}
      />
      <OrthographySection
        languageId={language.id}
        notes={summaryNotes.orthographyNotes}
      />
      <h3>Translations</h3>
      <p><Link to={'/language-translations/' + language.id}>View translations</Link></p>
    </>
  );
}

export default function ViewLanguage() {
  const id = useGetParamsOrSelectedId();
  if(!id) {
    throw new Error("No language ID was provided");
  }

  const languageResponse = useLanguage(id);
  const summaryNotesResponse = useLanguageSummaryNotes(id);

  const language = languageResponse.data;
  useSetPageTitle(language ? "Language: " + language.name : "Language Summary");

  if(languageResponse.status !== 'success') {
    return renderDatalessQueryResult(languageResponse);
  }

  if(summaryNotesResponse.status !== 'success') {
    return renderDatalessQueryResult(summaryNotesResponse);
  }

  return (
    <ViewLanguageInner
      language={languageResponse.data}
      summaryNotes={summaryNotesResponse.data}
    />
  );
}
