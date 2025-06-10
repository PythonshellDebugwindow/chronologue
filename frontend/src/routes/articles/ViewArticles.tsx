import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import ArticleTagList from '@/components/ArticleTagList';
import DisplayDate from '@/components/DisplayDate';

import { useArticles, useExistingArticleTags } from '@/hooks/articles';

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

function filterArticles(articles: IArticleOverview[], tag: string | null, content: string) {
  const filteredByTag = tag ? articles.filter(a => a.tags.includes(tag)) : articles;
  if(content) {
    const lowercaseContent = content.toLowerCase();
    return filteredByTag.filter(a => a.content.toLowerCase().includes(lowercaseContent));
  } else {
    return filteredByTag;
  }
}

interface IViewArticlesInner {
  articles: IArticleOverview[];
  existingTags: string[];
}

function ViewArticlesInner({ articles, existingTags }: IViewArticlesInner) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filteredTag = searchParams.get('tag');
  const [searchContent, setSearchContent] = useState("");

  const filteredArticles = filterArticles(articles, filteredTag, searchContent);

  function setFilteredTag(tag: string) {
    setSearchParams(params => {
      if(tag) {
        params.set('tag', tag);
      } else {
        params.delete('tag');
      }
      return params;
    });
  }

  return (
    <>
      <h2>View Articles</h2>
      <p>Viewing all articles.</p>
      <p>
        <label>
          Filter by tag:{" "}
          <select
            value={filteredTag ?? ""}
            onChange={e => setFilteredTag(e.target.value)}
          >
            <option value="">---</option>
            {existingTags.map(tag => (
              <option value={tag} key={tag}>{tag}</option>
            ))}
          </select>
        </label>
      </p>
      <p>
        <label>
          Search for content:{" "}
          <input
            type="text"
            value={searchContent}
            onChange={e => setSearchContent(e.target.value)}
          />
        </label>
      </p>
      <table className={styles.articlesTable}>
        <tbody>
          <tr>
            <th>Title and summary</th>
            <th>Tags</th>
            <th>Last edited</th>
          </tr>
          {filteredArticles.map(article => (
            <tr key={article.id}>
              <td>
                <Link to={'/article/' + article.id}>
                  {summarise(article.title)}
                </Link>
                <br />
                <small>{summarise(article.content)}</small>
              </td>
              <td>
                <ArticleTagList article={article} />
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
  const existingTagsResponse = useExistingArticleTags();

  useSetPageTitle("View Articles");

  if(articlesResponse.status !== 'success') {
    return renderDatalessQueryResult(articlesResponse);
  }

  if(existingTagsResponse.status !== 'success') {
    return renderDatalessQueryResult(existingTagsResponse);
  }

  return (
    <ViewArticlesInner
      articles={articlesResponse.data}
      existingTags={existingTagsResponse.data}
    />
  );
}
