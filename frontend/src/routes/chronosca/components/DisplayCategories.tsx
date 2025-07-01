import { Link } from 'react-router-dom';

import { SettingsTable } from '@/components/SettingsTable';

import { ICategory } from '@/types/phones';

function CategoriesList({ categories }: { categories: ICategory[] }) {
  if(categories.length === 0) {
    return <p>No categories set</p>;
  }

  return (
    <SettingsTable>
      {categories.map(category => (
        <tr key={category.letter}>
          <td>{category.letter}</td>
          <td>
            <input
              value={category.members.join(",")}
              disabled
              style={{ color: "black" }}
            />
          </td>
        </tr>
      ))}
    </SettingsTable>
  );
}

interface IDisplayCategories {
  languageId: string;
  categories: ICategory[]
}

export default function DisplayCategories({ languageId, categories }: IDisplayCategories) {
  return (
    <>
      <CategoriesList categories={categories} />
      <p style={{ marginTop: "0.4em" }}>
        <small>
          <Link to={'/edit-categories/' + languageId}>[edit categories]</Link>
        </small>
      </p>
    </>
  );
}
