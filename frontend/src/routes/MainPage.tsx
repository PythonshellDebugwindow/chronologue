import { useEffect } from 'react';

import { InfoParagraph } from '@/components/Paragraphs';
import RecentActivity from '@/components/RecentActivity';

export default function MainPage() {
  useEffect(() => {
    document.title = "Chronologue";
  }, []);

  return (
    <>
      <h2>Chronologue</h2>
      <InfoParagraph>
        Chronologue is a site for the creation of constructed languages. It allows you to
        manage your languages' dictionaries, grammar, phonologies, orthographies, and more.
      </InfoParagraph>
      <InfoParagraph>
        Specifically, the site is intended to make it easier and more convenient to create
        and manage large language families (diachronic conlanging), but it also works well
        for creating individual languages.
      </InfoParagraph>
      <RecentActivity />
    </>
  );
}
