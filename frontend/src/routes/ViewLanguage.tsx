import { useContext } from 'react';
import { Link } from 'react-router-dom';

import DisplayDate from '../components/DisplayDate.tsx';
import LanguageLink from '../components/LanguageLink.tsx';
import { LanguageTree } from '../components/LanguageTree.tsx';
import LinkButton from '../components/LinkButton.tsx';
import { OrthographySection } from '../components/ViewLanguageOrthography.tsx';
import { PhonologySection } from '../components/ViewLanguagePhonology.tsx';

import { useFamily } from '../familyData.tsx';
import {
  formatLanguageStatus, useLanguage, useLanguageSummaryNotes,
  ILanguage, ILanguageSummaryNotes
} from '../languageData.tsx';
import SelectedLanguageContext from '../SelectedLanguageContext.tsx';
import {
  renderDatalessQueryResult, useGetParamsOrSelectedId, useSetPageTitle
} from '../utils.tsx';
import { useLanguageWordCount } from '../wordData.tsx';

function useFamilyName(id: string) {
  const { isPending, error, data } = useFamily(id);
  if(isPending) {
    return "Loading...";
  } else if(error) {
    return error.message;
  } else {
    return data.name;
  }
}

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

function FamilyLink({ familyId }: { familyId: string }) {
  return (
    <Link to={ '/family/' + familyId }>
      { useFamilyName(familyId) }
    </Link>
  );
}

interface IViewLanguageInner {
  language: ILanguage;
  summaryNotes: ILanguageSummaryNotes;
}

function ViewLanguageInner({ language, summaryNotes }: IViewLanguageInner) {
  const { selectedLanguage, setSelectedLanguage } = useContext(SelectedLanguageContext);
  
  return (
    <>
      <h2>View Language: { language.name }</h2>
      {
        language.id !== selectedLanguage?.id && (
          <p>
            <LinkButton onClick={ () => setSelectedLanguage(language) }>
              Select
            </LinkButton>
          </p>
        )
      }
      <table className="info-table">
        <tbody>
          {
            language.autonym && (
              <tr>
                <th>Autonym:</th>
                <td>{ language.autonym }</td>
              </tr>
            )
          }
          <tr>
            <th>Family:</th>
            <td>
              {
                language.familyId !== null
                ? <FamilyLink familyId={ language.familyId } />
                : "None"
              }
            </td>
          </tr>
          {
            language.parentId !== null && (
              <tr>
                <th>Parent:</th>
                <td>
                  <LanguageLink id={ language.parentId } />
                </td>
              </tr>
            )
          }
          <tr>
            <th>Created:</th>
            <td>
              <DisplayDate date={ language.created } />
            </td>
          </tr>
          <tr>
            <th>Status:</th>
            <td>
              { formatLanguageStatus(language.status) }
            </td>
          </tr>
          {
            language.era && (
              <tr>
                <th>Era:</th>
                <td>{ language.era }</td>
              </tr>
            )
          }
          <tr>
            <th>Words:</th>
            <td>
              { useWordCount(language.id) }
            </td>
          </tr>
        </tbody>
      </table>
      {
        summaryNotes.description && (
          <p className="user-notes-paragraph" style={{ marginTop: "1em" }}>
            { summaryNotes.description }
          </p>
        )
      }
      <p><Link to={ '/edit-language/' + language.id }>Edit language</Link></p>
      <LanguageTree root={language} />
      <h3>Dictionary</h3>
      <p><Link to={ '/dictionary/' + language.id }>View dictionary</Link></p>
      <PhonologySection languageId={ language.id } />
      {
        summaryNotes.phonologyNotes && <>
          <h4>Notes</h4>
          <p className="user-notes-paragraph">{ summaryNotes.phonologyNotes }</p>
        </>
      }
      <OrthographySection languageId={ language.id } />
      {
        summaryNotes.orthographyNotes && <>
          <h4>Notes</h4>
          <p className="user-notes-paragraph">{ summaryNotes.orthographyNotes }</p>
        </>
      }
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
      language={ languageResponse.data }
      summaryNotes={ summaryNotesResponse.data }
    />
  );
};
