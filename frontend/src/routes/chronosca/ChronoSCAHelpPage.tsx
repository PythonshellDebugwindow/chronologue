import { Link } from 'react-router-dom';

import helpPageHtmlRaw from '@/assets/chronosca-help.html?raw';

import { useSetPageTitle } from '@/utils/global/hooks';

import styles from './ChronoSCAHelpPage.module.css';

const helpPageHtmlObject = { __html: helpPageHtmlRaw };

interface ITOCSection {
  id: string;
  title: string;
  subsections: {
    id: string;
    title: string;
  }[];
}

function TableOfContents() {
  const sections: ITOCSection[] = [];
  let currentSection: ITOCSection | null = null;

  const allHeadings = helpPageHtmlRaw.matchAll(/<h([34]) id="(.*?)">(.*?)<\/h[34]>/g);
  for(const [_, level, id, title] of [...allHeadings]) {
    if(level === "3") {
      currentSection = { id, title, subsections: [] };
      sections.push(currentSection);
    } else {
      currentSection?.subsections.push({ id, title });
    }
  }

  return (
    <ol className={styles.helpTOC}>
      {sections.map(section => (
        <li key={section.id}>
          <a href={"#" + section.id}>{section.title}</a>
          <ul>
            {section.subsections.map(subheading => (
              <li key={subheading.id}>
                <a href={"#" + subheading.id}>{subheading.title}</a>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export default function ChronoSCAHelpPage() {
  useSetPageTitle("ChronoSCA Help");

  return (
    <>
      <h2>ChronoSCA Help</h2>
      <p>
        This is a guide to using <Link to="/chronosca">ChronoSCA</Link>,
        Chronologue's built-in sound change applicator.
      </p>
      <div className={styles.helpTOCContainer}>
        <p>Table of Contents</p>
        <TableOfContents />
      </div>
      <div
        className={styles.help}
        dangerouslySetInnerHTML={helpPageHtmlObject}
      />
    </>
  );
}
