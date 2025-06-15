import { useQuery } from '@tanstack/react-query';

import { IArticle, IArticleFolder, IArticleOverview } from '@/types/articles';
import { ITitledError } from '@/types/titledError';

import {
  getBackendJson,
  parseRecordDates,
  parseSingleRecordDates
} from '@/utils/global/queries';

export function useArticle(id: string) {
  return useQuery<IArticle, ITitledError>({
    queryKey: ['articles', id],
    queryFn: async () => parseSingleRecordDates(await getBackendJson(`articles/${id}`))
  });
}

export function useArticleFolders() {
  return useQuery<IArticleFolder[], ITitledError>({
    queryKey: ['article-folders'],
    queryFn: async () => await getBackendJson('article-folders')
  });
}

export function useArticles() {
  return useQuery<IArticleOverview[], ITitledError>({
    queryKey: ['articles'],
    queryFn: async () => parseRecordDates(await getBackendJson('articles'))
  });
}

export function useExistingArticleTags() {
  return useQuery<string[], ITitledError>({
    queryKey: ['article-tags'],
    queryFn: async () => await getBackendJson('article-tags')
  });
}
