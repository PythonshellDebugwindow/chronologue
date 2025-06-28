import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { FamilyTree, IsolateList } from '@/components/LanguageTree';

import { useFamilies, useLanguageIsolates } from '@/hooks/families';

import { IFamily } from '@/types/families';
import { ILanguage } from '@/types/languages';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

function LanguageIsolates({ languages }: { languages: ILanguage[] }) {
  if(languages.length === 0) {
    return null;
  }

  return (
    <>
      <h3>Isolates</h3>
      <IsolateList languages={languages} />
    </>
  );
}

interface IViewLanguagesInner {
  families: IFamily[];
  isolates: ILanguage[];
}

function ViewLanguagesInner({ families, isolates }: IViewLanguagesInner) {
  return (
    <>
      <h2>View Languages</h2>
      {families.map(family => (
        <Fragment key={family.id}>
          <h3>
            <Link to={'/family/' + family.id}>
              {family.name}
            </Link>
          </h3>
          <FamilyTree id={family.id} showSelect={false} />
        </Fragment>
      ))}
      <LanguageIsolates languages={isolates} />
      {families.length === 0 && isolates.length === 0 && (
        <p>You have not added any languages yet.</p>
      )}
    </>
  );
}

export default function ViewLanguages() {
  const familiesResponse = useFamilies();
  const isolatesResponse = useLanguageIsolates();

  useSetPageTitle("View Languages");

  if(familiesResponse.status !== 'success') {
    return renderDatalessQueryResult(familiesResponse);
  }

  if(isolatesResponse.status !== 'success') {
    return renderDatalessQueryResult(isolatesResponse);
  }

  return (
    <ViewLanguagesInner
      families={familiesResponse.data}
      isolates={isolatesResponse.data}
    />
  );
}
