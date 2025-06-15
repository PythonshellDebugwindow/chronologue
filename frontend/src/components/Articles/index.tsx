import { Link } from 'react-router-dom';

import { IArticleFolder } from '@/types/articles';

interface IArticleFolderLink {
  folderId: string;
  allFolders: IArticleFolder[];
}

export function ArticleFolderLink({ folderId, allFolders }: IArticleFolderLink) {
  const folder = allFolders.find(folder => folder.id === folderId);
  if(!folder) {
    return "[not found]";
  }
  return <Link to={'/articles?folder=' + folder.name}>{folder.name}</Link>;
}

interface IArticleWithTags {
  tags: string[];
}

export function ArticleTagList({ article }: { article: IArticleWithTags }) {
  return article.tags.flatMap((tag, i) => {
    const tagLink = <Link to={'/articles?tag=' + tag} key={tag}>{tag}</Link>;
    return i === 0 ? [tagLink] : [", ", tagLink];
  });
}
