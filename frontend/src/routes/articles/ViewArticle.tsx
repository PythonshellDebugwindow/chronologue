import { Link, useParams } from 'react-router-dom';

import ArticleTagList from '@/components/ArticleTagList';
import DisplayDate from '@/components/DisplayDate';
import InfoTable from '@/components/InfoTable';

import { useArticle } from '@/hooks/articles';

import { IArticle } from '@/types/articles';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult } from '@/utils/global/queries';

import styles from './ViewArticle.module.css';

function ViewArticleInner({ article }: { article: IArticle }) {
  return (
    <>
      <h2>Article: {article.title}</h2>
      <InfoTable>
        <tr>
          <th>Created:</th>
          <td>
            <DisplayDate date={article.created} />
          </td>
        </tr>
        {article.updated && (
          <tr>
            <th>Updated:</th>
            <td>
              <DisplayDate date={article.updated} />
            </td>
          </tr>
        )}
      </InfoTable>
      {article.tags.length > 0 && (
        <div className={styles.tags}>
          <b>Tags:</b>
          <span><ArticleTagList article={article} /></span>
        </div>
      )}
      <p><Link to={'/edit-article/' + article.id}>Edit article</Link></p>
      <p className={styles.content}>
        {article.content}
      </p>
    </>
  );
}

export default function ViewArticle() {
  const { id } = useParams();
  if(!id) {
    throw new Error("No article ID was provided");
  }

  const articleResponse = useArticle(id);

  const article = articleResponse.data;
  useSetPageTitle(article ? "Article: " + article.title : "View Article");

  if(articleResponse.status !== 'success') {
    return renderDatalessQueryResult(articleResponse);
  }

  return <ViewArticleInner article={articleResponse.data} />;
}
