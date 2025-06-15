import { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

import DOMPurify from 'dompurify';
import parse, { domToReact, Element, HTMLReactParserOptions } from 'html-react-parser';

import { ArticleFolderLink, ArticleTagList } from '@/components/Articles';
import DisplayDate from '@/components/DisplayDate';
import InfoTable from '@/components/InfoTable';

import { useArticle, useArticleFolders } from '@/hooks/articles';

import { IArticle, IArticleFolder } from '@/types/articles';

import { useScrollToHashOnLoad, useSetPageTitle } from '@/utils/global/hooks';
import { parseAtSignLinkMarkup } from '@/utils/global/markup';
import { renderDatalessQueryResult } from '@/utils/global/queries';

import styles from './ViewArticle.module.css';

interface IHeader {
  element: ReactNode;
  children: ReactNode[];
}

function parseArticleContent(content: string) {
  const headers: IHeader[] = [];
  let nextHeaderId = 1;

  const options: HTMLReactParserOptions = {
    replace: element => {
      if(element instanceof Element) {
        if(element.name === 'h1' || element.name === 'h2') {
          const children = element.children.filter(x => (
            x instanceof Element || x.type === 'text'
          ));
          const childElements = domToReact(children, options);
          const headerId = "s" + nextHeaderId;
          const headerLink = <a href={"#" + headerId}>{childElements}</a>;
          if(element.name === 'h1' || headers.length === 0) {
            headers.push({ element: headerLink, children: [] });
          } else {
            headers[headers.length - 1].children.push(headerLink);
          }
          element.attribs.id = headerId;
          ++nextHeaderId;
        }
      } else if(element.type === 'text' && /\S/.test(element.data)) {
        const formatted = parseAtSignLinkMarkup(element.data.replace(/^\n+|\n+$/g, ""));
        return <span>{formatted}</span>;
      }
    }
  };

  const sanitisedContent = DOMPurify.sanitize(content);
  const parsedContent = parse(sanitisedContent, options);
  return { headers, content: parsedContent };
}

function ArticleTOC({ headers }: { headers: IHeader[] }) {
  useScrollToHashOnLoad();

  return (
    <div className={styles.tocContainer}>
      <p>Table of Contents</p>
      <ol className={styles.toc}>
        {headers.map((header, i) => (
          <li key={i}>
            {header.element}
            {header.children.length > 0 && (
              <ol>
                {header.children.map((child, j) => (
                  <li key={j}>{child}</li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ArticleContent({ content }: { content: string }) {
  const parsed = parseArticleContent(content);
  return (
    <>
      {parsed.headers.length > 0 && (
        <ArticleTOC headers={parsed.headers} />
      )}
      <div className={styles.content}>
        {parsed.content}
      </div>
    </>
  );
}

interface IViewArticleInner {
  article: IArticle;
  folders: IArticleFolder[];
}

function ViewArticleInner({ article, folders }: IViewArticleInner) {
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
      {article.folderId !== null && (
        <div className={styles.tags}>
          <b>Folder:</b>
          <span>
            <ArticleFolderLink
              folderId={article.folderId}
              allFolders={folders}
            />
          </span>
        </div>
      )}
      {article.tags.length > 0 && (
        <div className={styles.tags}>
          <b>Tags:</b>
          <span>
            <ArticleTagList article={article} />
          </span>
        </div>
      )}
      <p><Link to={'/edit-article/' + article.id}>Edit article</Link></p>
      <ArticleContent content={article.content} />
    </>
  );
}

export default function ViewArticle() {
  const { id } = useParams();
  if(!id) {
    throw new Error("No article ID was provided");
  }

  const articleResponse = useArticle(id);
  const foldersResponse = useArticleFolders();

  const article = articleResponse.data;
  useSetPageTitle(article ? "Article: " + article.title : "View Article");

  if(articleResponse.status !== 'success') {
    return renderDatalessQueryResult(articleResponse);
  }

  if(foldersResponse.status !== 'success') {
    return renderDatalessQueryResult(foldersResponse);
  }

  return (
    <ViewArticleInner
      article={articleResponse.data}
      folders={foldersResponse.data}
    />
  );
}
