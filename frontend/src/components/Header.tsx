import { ReactNode, useContext, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

import SelectedLanguageContext from '../SelectedLanguageContext.tsx';

import chronologue from '/chronologue.png';

interface IMenuBarItem {
  name: string;
  items: ReactNode[];
  setCanHover: (canHover: boolean) => void;
}

function MenuBarItem({ name, items, setCanHover }: IMenuBarItem) {
  return (
    <div className="header-menu-item" onMouseEnter={ () => setCanHover(true) }>
      {name}
      <div className="header-submenu">
        {
          items.map((item, i) => (
            <div
              className="header-submenu-item"
              onClick={ () => setCanHover(false) }
              key={i}
            >
              {item}
            </div>
          ))
        }
      </div>
    </div>
  );
}

export default function Header() {
  const { selectedLanguage } = useContext(SelectedLanguageContext);
  const [ canHover, setCanHover ] = useState(true);
  
  return (
    <>
      <p id="selected-language">
        Selected:{" "}
        {
          selectedLanguage
          ? <Link to={ '/language/' + selectedLanguage.id }>{selectedLanguage.name}</Link>
          : "None"
        }
      </p>
      <Link to="/" className="top-left-logo">
        <img src={chronologue} className="logo react" alt="Chronologue logo" />
        <h1>Chronologue</h1>
      </Link>
      <div className={ "header-menu" + (canHover ? "" : " no-dropdown") }>
        <MenuBarItem
          name="Phonology"
          items={[
            <Link to="/phonology">Edit Phonology</Link>,
            <Link to="/alphabetical-order">Alphabetical Order</Link>,
            <Link to="/edit-categories">Edit Categories</Link>,
            <Link to="/estimate-ipa">IPA Estimation</Link>
          ]}
          setCanHover={setCanHover}
        />
        <MenuBarItem
          name="Dictionary"
          items={[
            <Link to="/add-word">Add Word</Link>,
            <Link to="/dictionary">View Dictionary</Link>,
            <Link to="/dictionary-settings">Dictionary Settings</Link>
          ]}
          setCanHover={setCanHover}
        />
        <MenuBarItem
          name="Grammar"
          items={[
            <Link to="/grammar-forms">Grammar Forms</Link>
          ]}
          setCanHover={setCanHover}
        />
        <MenuBarItem
          name="Literature"
          items={[
            <Link to="/">Something</Link>
          ]}
          setCanHover={setCanHover}
        />
        <MenuBarItem
          name="Languages"
          items={[
            <Link to="/languages">All Languages</Link>,
            <Link to="/add-family">Add Family</Link>,
            <Link to="/add-language">Add Language</Link>
          ]}
          setCanHover={setCanHover}
        />
      </div>
      <Outlet />
    </>
  )
};
