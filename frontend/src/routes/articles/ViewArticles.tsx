import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { ArticleFolderLink, ArticleTagList } from '@/components/Articles';
import DisplayDate from '@/components/DisplayDate';

import { useArticleFolders, useArticles, useExistingArticleTags } from '@/hooks/articles';

import { IArticleFolder, IArticleOverview } from '@/types/articles';

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

function filterArticles(
  articles: IArticleOverview[], tag: string | null, folder: IArticleFolder | null, content: string
) {
  if(tag) {
    articles = articles.filter(a => a.tags.includes(tag));
  }
  if(folder) {
    articles = articles.filter(a => a.folderId === folder.id);
  }
  if(content) {
    const lowercaseContent = content.toLowerCase();
    articles = articles.filter(a => a.content.toLowerCase().includes(lowercaseContent));
  }
  return articles;
}

interface IViewArticlesInner {
  articles: IArticleOverview[];
  existingTags: string[];
  folders: IArticleFolder[];
}

function ViewArticlesInner({ articles, existingTags, folders }: IViewArticlesInner) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filteredTag = searchParams.get('tag');
  const filteredFolderName = searchParams.get('folder');
  const filteredFolder = folders.find(folder => folder.name === filteredFolderName);
  const [searchContent, setSearchContent] = useState("");

  const filteredArticles = filterArticles(
    articles, filteredTag, filteredFolder ?? null, searchContent
  );

  function setFilterParam(name: string, value: string) {
    setSearchParams(params => {
      if(value) {
        params.set(name, value);
      } else {
        params.delete(name);
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
          Folder:{" "}
          <select
            value={filteredFolderName ?? ""}
            onChange={e => setFilterParam('folder', e.target.value)}
          >
            <option value="">---</option>
            {folders.map(folder => (
              <option value={folder.name} key={folder.id}>{folder.name}</option>
            ))}
          </select>
        </label>
      </p>
      <p>
        <label>
          Filter by tag:{" "}
          <select
            value={filteredTag ?? ""}
            onChange={e => setFilterParam('tag', e.target.value)}
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
            <th>Folder</th>
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
                {article.folderId && (
                  <ArticleFolderLink
                    folderId={article.folderId}
                    allFolders={folders}
                  />
                )}
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
      {articles.length > 0 && filteredArticles.length === 0 && (
        <p>No articles match the given filters.</p>
      )}
    </>
  );
}

export default function ViewArticles() {
  const articlesResponse = useArticles();
  const existingTagsResponse = useExistingArticleTags();
  const foldersResponse = useArticleFolders();

  useSetPageTitle("View Articles");

  if(articlesResponse.status !== 'success') {
    return renderDatalessQueryResult(articlesResponse);
  }

  if(existingTagsResponse.status !== 'success') {
    return renderDatalessQueryResult(existingTagsResponse);
  }

  if(foldersResponse.status !== 'success') {
    return renderDatalessQueryResult(foldersResponse);
  }

  return (
    <ViewArticlesInner
      articles={articlesResponse.data}
      existingTags={existingTagsResponse.data}
      folders={foldersResponse.data}
    />
  );
}
