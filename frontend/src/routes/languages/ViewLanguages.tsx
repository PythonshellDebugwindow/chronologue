import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { FamilyTree } from '@/components/LanguageTree';

import { useFamilies, useLanguageIsolates } from '@/hooks/families';

import { IFamily } from '@/types/families';
import { ILanguage } from '@/types/languages';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

function LanguageIsolates({ languages }: { languages: ILanguage[] }) {
  if(languages.length === 0) {
    return null;
  }

  languages.sort((lang1, lang2) => lang1.name.localeCompare(lang2.name));

  return (
    <>
      <h3>Isolates</h3>
      <ul className="language-tree-root">
        {languages.map(lang => (
          <li key={lang.id}>
            <Link to={'/language/' + lang.id}>
              {lang.name}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

interface IViewLanguagesInner {
  families: IFamily[];
  isolates: ILanguage[];
}

function ViewLanguagesInner({ families, isolates }: IViewLanguagesInner) {
  families.sort((f1, f2) => f1.name.localeCompare(f2.name));

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
