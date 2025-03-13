import { useContext } from 'react';
import { Link } from 'react-router-dom';

import DisplayDate from '../components/DisplayDate.tsx';
import LanguageLink from '../components/LanguageLink.tsx';
import { LanguageTree } from '../components/LanguageTree.tsx';
import { OrthographySection } from '../components/ViewLanguageOrthography.tsx';
import { PhonologySection } from '../components/ViewLanguagePhonology.tsx';

import { getFamilyById } from '../familyData.tsx';
import {
  formatLanguageStatus, getLanguageById, getLanguageSummaryNotes,
  ILanguage, ILanguageSummaryNotes
} from '../languageData.tsx';
import SelectedLanguageContext from '../SelectedLanguageContext.tsx';
import { useGetParamsOrSelectedId, useSetPageTitle } from '../utils.tsx';
import { getWordsByLanguage } from '../wordData.tsx';

function getFamilyName(id: string) {
  const { isPending, error, data } = getFamilyById(id);
  if(isPending) {
    return "Loading...";
  } else if(error) {
    return error.message;
  } else {
    return data.name;
  }
}

function getWordCount(id: string) {
  const { isPending, error, data } = getWordsByLanguage(id);
  if(isPending) {
    return "Loading...";
  } else if(error) {
    return error.message;
  } else {
    return data.length;
  }
}

function FamilyLink({ familyId }: { familyId: string }) {
  return (
    <Link to={ '/family/' + familyId }>
      { getFamilyName(familyId) }
    </Link>
  );
}

interface IRealViewLanguage {
  language: ILanguage;
  summaryNotes: ILanguageSummaryNotes;
}

function RealViewLanguage({ language, summaryNotes }: IRealViewLanguage) {
  const { selectedLanguage, setSelectedLanguage } = useContext(SelectedLanguageContext);
  
  return (
    <>
      <h2>View Language: { language.name }</h2>
      {
        language.id !== selectedLanguage?.id && (
          <p>
            <Link to="" onClick={ () => setSelectedLanguage(language) }>Select</Link>
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
              { getWordCount(language.id) }
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
  
  const languageResponse = getLanguageById(id);
  const summaryNotesResponse = getLanguageSummaryNotes(id);
  
  const language = languageResponse.data;
  useSetPageTitle(language ? "Language: " + language.name : "Language Summary");

  if(languageResponse.status === 'pending') {
    return <p>Loading language summary...</p>;
  } else if(languageResponse.status === 'error') {
    return (
      <>
        <h2>{ languageResponse.error.title }</h2>
        <p>{ languageResponse.error.message }</p>
      </>
    );
  }

  if(summaryNotesResponse.status === 'pending') {
    return <p>Loading language summary...</p>;
  } else if(summaryNotesResponse.status === 'error') {
    return (
      <>
        <h2>{ summaryNotesResponse.error.title }</h2>
        <p>{ summaryNotesResponse.error.message }</p>
      </>
    );
  }
  
  return (
    <RealViewLanguage
      language={ languageResponse.data }
      summaryNotes={ summaryNotesResponse.data }
    />
  );
};
