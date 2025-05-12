import { useEffect } from 'react';

export default function MainPage() {
  useEffect(() => {
    document.title = "Chronologue";
  }, []);

  return (
    <>
      <h2>Chronologue</h2>
      <p className="grammar-table-paragraph">
        Chronologue is a site for the creation of constructed languages. It allows you to
        manage your languages' dictionaries, grammar, phonologies, orthographies, and more.
      </p>
      <p className="grammar-table-paragraph">
        Specifically, the site is intended to make it easier and more convenient to create
        and manage large language families (diachronic conlanging), but it also works well
        for creating individual languages.
      </p>
    </>
  );
};
