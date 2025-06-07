import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useArticle } from '@/hooks/articles';

import { IArticle } from '@/types/articles';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendRequest } from '@/utils/global/queries';

function DeleteArticleInner({ article }: { article: IArticle }) {
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState("");

  async function deleteFormArticle() {
    const result = await sendBackendRequest(`articles/${article.id}`, 'DELETE');
    if(!result.ok) {
      setErrorMessage(result.body.message);
      return;
    }

    navigate('/articles');
  }

  return (
    <>
      <h2>Delete Article</h2>
      <p>
        Really delete <Link to={'/article/' + article.id}>{article.title}</Link>?
      </p>
      <p>
        <b>This action cannot be undone!</b>
      </p>
      <button onClick={deleteFormArticle} style={{ marginBottom: "15px" }}>
        Delete article
      </button>
      <br />
      <button onClick={() => navigate(-1)}>
        Go back
      </button>
      {errorMessage && <p><b>Error: {errorMessage}</b></p>}
    </>
  );
}

export default function DeleteArticle() {
  const { id: articleId } = useParams();
  if(!articleId) {
    throw new Error("No article ID was provided");
  }

  const articleResponse = useArticle(articleId);

  useSetPageTitle("Delete Article");

  if(articleResponse.status !== 'success') {
    return renderDatalessQueryResult(articleResponse);
  }

  return <DeleteArticleInner article={articleResponse.data} />;
}
