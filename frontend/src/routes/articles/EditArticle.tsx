import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import CreatableSelect from 'react-select/creatable';
import { useQueryClient } from '@tanstack/react-query';

import { CForm, CFormBody, CTextInput } from '@/components/CForm';

import { useArticle, useExistingArticleTags } from '@/hooks/articles';

import { IArticle } from '@/types/articles';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

import styles from './index.module.css';

interface IEditArticleInner {
  initialArticle: IArticle;
  existingTags: string[];
}

function EditArticleInner({ initialArticle, existingTags }: IEditArticleInner) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(initialArticle.title);
  const [content, setContent] = useState(initialArticle.content);
  const [tags, setTags] = useState(initialArticle.tags);
  const [errorMessage, setErrorMessage] = useState("");

  async function editFormArticle() {
    if(!title) {
      setErrorMessage("Please enter a title");
      return;
    }

    const data = { title, content, tags };
    const result = await sendBackendJson(`articles/${initialArticle.id}`, 'PUT', data);
    if(!result.ok) {
      setErrorMessage(result.body.message);
      return;
    }

    queryClient.resetQueries({ queryKey: ['articles', initialArticle.id] });
    navigate(`/article/${initialArticle.id}`);
  }

  return (
    <>
      <h2>Edit Article</h2>
      {errorMessage && <p>{errorMessage}</p>}
      <CForm>
        <CFormBody>
          <CTextInput
            label="Title"
            name="title"
            state={title}
            setState={setTitle}
          />
        </CFormBody>
      </CForm>
      <div className={styles.content}>
        <h4>Content:</h4>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          spellCheck={false}
        />
      </div>
      <CForm>
        <CFormBody>
          <tr>
            <td>Tags:</td>
            <td>
              <CreatableSelect
                isMulti
                value={tags.map(tag => ({ value: tag, label: tag }))}
                options={existingTags.map(tag => ({ value: tag, label: tag }))}
                isClearable={false}
                components={{ IndicatorSeparator: () => null }}
                styles={{
                  control: styles => ({ ...styles, minHeight: "unset", borderColor: "#767676" }),
                  dropdownIndicator: styles => ({ ...styles, padding: "0" }),
                  valueContainer: styles => ({ ...styles, padding: "0 2px" }),
                  input: styles => ({
                    ...styles, margin: "0", paddingBottom: "0", paddingTop: "0", fontSize: "0.9em"
                  }),
                  option: styles => ({ ...styles, fontSize: "0.8em", padding: "5px" }),
                  menu: styles => ({ ...styles, top: "auto", bottom: "100%", width: "12em" }),
                  multiValueLabel: styles => ({ ...styles, padding: "0", paddingLeft: "3px", paddingRight: "2px" }),
                  multiValueRemove: styles => ({ ...styles, paddingLeft: "3px", paddingRight: "3px" }),
                  noOptionsMessage: styles => ({ ...styles, padding: "0", fontSize: "0.9em", color: "#555" }),
                  placeholder: styles => ({ ...styles, fontSize: "0.9em" })
                }}
                onChange={e => setTags(e.map(option => option.label))}
              />
            </td>
          </tr>
        </CFormBody>
        <button type="button" onClick={editFormArticle}>
          Save changes
        </button>
        <button type="button" onClick={() => navigate('/article/' + initialArticle.id)}>
          Back
        </button>
      </CForm>
      <h4>Delete Article</h4>
      <p>
        <Link to={'/delete-article/' + initialArticle.id}>
          Delete this article
        </Link>
      </p>
    </>
  );
}

export default function EditArticle() {
  const { id: articleId } = useParams();
  if(!articleId) {
    throw new Error("No article ID was provided");
  }

  const articleResponse = useArticle(articleId);
  const existingTags = useExistingArticleTags();

  useSetPageTitle("Edit Article");

  if(articleResponse.status !== 'success') {
    return renderDatalessQueryResult(articleResponse);
  }

  if(existingTags.status !== 'success') {
    return renderDatalessQueryResult(existingTags);
  }

  return (
    <EditArticleInner
      initialArticle={articleResponse.data}
      existingTags={existingTags.data}
    />
  );
}
