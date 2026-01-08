import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import FamilyLink from '@/components/FamilyLink';
import LanguageLink from '@/components/LanguageLink';
import WordLink from '@/components/WordLink';

import { ITitledError } from '@/types/titledError';

import { assertUnreachable } from '@/utils/global/asserts';
import { getBackendJson, parseRecordDates } from '@/utils/global/queries';

import styles from './RecentActivity.module.css';

type IRecentEvent = ({
  type: 'article';
  id: string;
  title: string;
} | {
  type: 'family' | 'language';
  id: string;
  name: string;
} | {
  type: 'languageTranslation';
  translId: string;
  langId: string;
} | {
  type: 'translation';
  id: string;
  content: string;
} | {
  type: 'words';
  firstId: string;
  wordCount: string;
  langId: string;
}) & {
  created: Date;
};

function useRecentActivity() {
  return useQuery<IRecentEvent[], ITitledError>({
    queryKey: ['recent-activity'],
    queryFn: async () => parseRecordDates(await getBackendJson('recent-activity'))
  });
}

function summarise(text: string) {
  const maxLength = 50;
  if(text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

function RecentActivitySummary({ item }: { item: IRecentEvent }) {
  switch(item.type) {
    case 'article':
      return (
        <>
          New article: <Link to={'/article/' + item.id}>{item.title}</Link>
        </>
      );

    case 'family':
      return (
        <>
          New family: <FamilyLink id={item.id} />
        </>
      );

    case 'language':
      return (
        <>
          New language: <LanguageLink id={item.id} />
        </>
      );

    case 'languageTranslation': {
      const url = `/translation/${item.translId}?lang=${item.langId}`;
      return (
        <>
          <Link to={url}>New translation</Link> into <LanguageLink id={item.langId} />
        </>
      );
    }

    case 'translation':
      return (
        <>
          New translation: <Link to={'/translation/' + item.id}>{summarise(item.content)}</Link>
        </>
      );

    case 'words':
      if(item.wordCount === "1") {
        return (
          <>
            New word: <WordLink id={item.firstId} /> added to <LanguageLink id={item.langId} />
          </>
        );
      } else {
        return (
          <>
            <Link to={'/word/' + item.firstId}>{item.wordCount} new words</Link>{" "}
            added to <LanguageLink id={item.langId} />
          </>
        );
      }

    default:
      assertUnreachable(item);
  }
}

function RecentActivityInner() {
  const { isPending, error, data: recentActivity } = useRecentActivity();

  if(isPending) {
    return <p>Loading...</p>;
  } else if(error) {
    return <p>Could not load recent activity: {error.message}</p>;
  } else if(recentActivity.length === 0) {
    return <p>No activity found.</p>;
  }

  return (
    <div className={styles.recentActivity}>
      {recentActivity.map((item, i) => (
        <div key={i}>
          <i>
            {item.created.toLocaleString("en-gb", { dateStyle: "medium", timeStyle: "short" })}
          </i>
          <RecentActivitySummary item={item} />
        </div>
      ))}
    </div>
  );
}

export default function RecentActivity() {
  return (
    <>
      <h3>Recent activity</h3>
      <RecentActivityInner />
    </>
  );
}
