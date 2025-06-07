import { Link } from 'react-router-dom';

import DisplayDate from '@/components/DisplayDate';

import { useArticles } from '@/hooks/articles';

import { IArticleOverview } from '@/types/articles';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

import styles from './ViewArticles.module.css';

function summarise(text: string) {
  const maxLength = 75;
  if(text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

function ViewArticlesInner({ articles }: { articles: IArticleOverview[] }) {
  return (
    <>
      <h2>View Articles</h2>
      <p>Viewing all articles.</p>
      <table className={styles.articlesTable}>
        <tbody>
          <tr>
            <th>Title and summary</th>
            <th>Tags</th>
            <th>Last edited</th>
          </tr>
          {articles.map(article => (
            <tr key={article.id}>
              <td>
                <Link to={'/article/' + article.id}>
                  {summarise(article.title)}
                </Link>
                <br />
                {summarise(article.content)}
              </td>
              <td>
                {article.tags.join(", ")}
              </td>
              <td>
                <DisplayDate date={article.updated} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {articles.length === 0 && (
        <p>You have not written any articles yet.</p>
      )}
    </>
  );
}

export default function ViewArticles() {
  const articlesResponse = useArticles();

  useSetPageTitle("View Articles");

  if(articlesResponse.status !== 'success') {
    return renderDatalessQueryResult(articlesResponse);
  }

  return <ViewArticlesInner articles={articlesResponse.data} />;
}
