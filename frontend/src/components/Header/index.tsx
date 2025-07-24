import { ReactNode, useContext, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

import SelectedLanguageContext from '@/contexts/SelectedLanguageContext';

import chronologueLogo from '/chronologue.png';

import styles from './Header.module.css';

interface IMenuBarItem {
  name: string;
  items: ReactNode[];
  setCanHover: (canHover: boolean) => void;
}

function MenuBarItem({ name, items, setCanHover }: IMenuBarItem) {
  return (
    <div className={styles.topMenuItem} onMouseEnter={() => setCanHover(true)}>
      {name}
      <div className={styles.submenu}>
        {items.map((item, i) => (
          <div
            className={styles.submenuItem}
            onClick={() => setCanHover(false)}
            key={i}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Header() {
  const { selectedLanguage } = useContext(SelectedLanguageContext);

  const [canHover, setCanHover] = useState(true);

  return (
    <>
      <p className={styles.selectedLanguage}>
        Selected:{" "}
        {
          selectedLanguage
            ? <Link to={'/language/' + selectedLanguage.id}>{selectedLanguage.name}</Link>
            : "None"
        }
      </p>
      <Link to="/" className={styles.logoAndName}>
        <img src={chronologueLogo} className={styles.logo} alt="Chronologue logo" />
        <h1>Chronologue</h1>
      </Link>
      <div className={styles.topMenu + (canHover ? " " + styles.canHover : "")}>
        <MenuBarItem
          name="Phonology"
          items={[
            <Link to="/phonology">Edit Phonology</Link>,
            <Link to="/orthography-settings">Orthography Settings</Link>,
            <Link to="/edit-categories">Edit Categories</Link>,
            <Link to="/estimate-ipa">Edit IPA Estimation</Link>,
            <Link to="/chronosca">Test ChronoSCA</Link>
          ]}
          setCanHover={setCanHover}
        />
        <MenuBarItem
          name="Dictionary"
          items={[
            <Link to="/add-word">Add Word</Link>,
            <Link to="/dictionary">View Dictionary</Link>,
            <Link to="/dictionary-settings">Dictionary Settings</Link>,
            <Link to="/mass-edit-dictionary">Mass Edit Dictionary</Link>,
            <Link to="/dictionary-chronosca">Dictionary ChronoSCA</Link>,
            <Link to="/import-words">Import Words</Link>,
            <Link to="/export-words">Export Words</Link>,
            <Link to="/derivation-rules">Edit Derivation Rules</Link>,
            <Link to="/purge-dictionary">Purge Dictionary</Link>
          ]}
          setCanHover={setCanHover}
        />
        <MenuBarItem
          name="Grammar"
          items={[
            <Link to="/grammar-tables">View Grammar Tables</Link>,
            <Link to="/add-grammar-table">Add Grammar Table</Link>,
            <Link to="/edit-stems">Edit Word Stems</Link>,
            <Link to="/grammar-forms">Grammar Forms</Link>
          ]}
          setCanHover={setCanHover}
        />
        <MenuBarItem
          name="Literature"
          items={[
            <Link to="/translations">View Translations</Link>,
            <Link to="/add-translation">Add Translation</Link>,
            <Link to="/language-translations">Language Translations</Link>,
            <Link to="/articles">View Articles</Link>,
            <Link to="/add-article">Add Article</Link>,
            <Link to="/article-folders">Edit Article Folders</Link>
          ]}
          setCanHover={setCanHover}
        />
        <MenuBarItem
          name="Languages"
          items={[
            <Link to="/languages">View All Languages</Link>,
            <Link to="/add-family">Add Family</Link>,
            <Link to="/add-language">Add Language</Link>,
            <Link to="/edit-language">Language Settings</Link>
          ]}
          setCanHover={setCanHover}
        />
      </div>
      <Outlet />
    </>
  );
}
