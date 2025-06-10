import { Link } from 'react-router-dom';

interface IArticleWithTags {
  tags: string[];
}

export default function ArticleTagList({ article }: { article: IArticleWithTags }) {
  return article.tags.flatMap((tag, i) => {
    const tagLink = <Link to={'/articles?tag=' + tag} key={tag}>{tag}</Link>;
    return i === 0 ? [tagLink] : [", ", tagLink];
  });
}
