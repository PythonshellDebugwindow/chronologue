import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreatableSelect from 'react-select/creatable';

import { CForm, CFormBody, CSelect, CTextInput } from '@/components/CForm';

import { useArticleFolders, useExistingArticleTags } from '@/hooks/articles';

import { IArticleFolder } from '@/types/articles';

import { useSetPageTitle } from '@/utils/global/hooks';
import { renderDatalessQueryResult, sendBackendJson } from '@/utils/global/queries';

import styles from './index.module.css';

interface IAddArticleInner {
  existingTags: string[];
  folders: IArticleFolder[];
}

function AddArticleInner({ existingTags, folders }: IAddArticleInner) {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useSetPageTitle("Add Article");

  async function addFormArticle() {
    if(!title) {
      setMessage("Please enter a title.");
      return;
    } else if(!content) {
      setMessage("Article content cannot be empty.");
      return;
    }

    const data = { title, content, folderId, tags };
    const result = await sendBackendJson('articles', 'POST', data);
    if(!result.ok) {
      setMessage(result.body.message);
      return;
    }

    navigate(`/article/${result.body}`);
  }

  return (
    <>
      <h2>Add Article</h2>
      <p>Add a new article.</p>
      {message && <p><b>{message}</b></p>}
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
          <CSelect
            label="Folder"
            name="folder"
            state={folderId ?? ""}
            setState={id => setFolderId(id || null)}
            width="100%"
          >
            <option value="">None</option>
            {folders.map(folder => (
              <option value={folder.id} key={folder.id}>{folder.name}</option>
            ))}
          </CSelect>
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
        <button type="button" onClick={addFormArticle}>
          Add Article
        </button>
      </CForm>
    </>
  );
}

export default function AddArticle() {
  const existingTagsResponse = useExistingArticleTags();
  const foldersResponse = useArticleFolders();

  if(existingTagsResponse.status !== 'success') {
    return renderDatalessQueryResult(existingTagsResponse);
  }

  if(foldersResponse.status !== 'success') {
    return renderDatalessQueryResult(foldersResponse);
  }

  return (
    <AddArticleInner
      existingTags={existingTagsResponse.data}
      folders={foldersResponse.data}
    />
  );
}
