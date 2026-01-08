import type { RequestHandler } from 'express';

import query from '../db/index.js';

export const getRecentActivity: RequestHandler = async (res, req) => {
  const activityLimit = 50;

  const recentArticles = await query(
    `
      SELECT
        translate(id::text, '-', '') AS id,
        title, created,
        'article' AS type
      FROM articles
      ORDER BY created DESC
      LIMIT ${activityLimit}
    `
  );

  const recentFamilies = await query(
    `
      SELECT
        translate(id::text, '-', '') AS id,
        name, created,
        'family' AS type
      FROM families
      ORDER BY created DESC
      LIMIT ${activityLimit}
    `
  );

  const recentLanguages = await query(
    `
      SELECT
        translate(id::text, '-', '') AS id,
        name, created,
        'language' AS type
      FROM languages
      ORDER BY created DESC
      LIMIT ${activityLimit}
    `
  );

  const recentLanguageTranslations = await query(
    `
      SELECT
        translate(transl_id::text, '-', '') AS "translId",
        translate(lang_id::text, '-', '') AS "langId",
        created,
        'languageTranslation' AS type
      FROM language_translations
      ORDER BY created DESC
      LIMIT ${activityLimit}
    `
  );

  const recentTranslations = await query(
    `
      SELECT
        translate(id::text, '-', '') AS id,
        content, created,
        'translation' AS type
      FROM translations
      ORDER BY created DESC
      LIMIT ${activityLimit}
    `
  );

  const recentWords = await query(
    `
      -- Start a new item after every gap of 5 hours or longer
      WITH with_prev AS (
        SELECT
          id, lang_id, created,
          lag(created) OVER (PARTITION BY lang_id ORDER BY created) AS prev_created
        FROM words
      ),
      islands AS (
        SELECT
          id, lang_id, created,
          (prev_created IS NULL OR created - prev_created > INTERVAL '5 hours') AS is_new_island
        FROM with_prev
      ),
      numbered_islands AS (
        SELECT
          id, lang_id, created,
          sum(is_new_island::int) OVER (PARTITION BY lang_id ORDER BY created) AS island_number
        FROM islands
      ),
      word_groups AS (
        SELECT DISTINCT ON (island_number, lang_id)
          id AS first_id,
          max(created) OVER (PARTITION BY island_number, lang_id) AS created,
          count(*) OVER (PARTITION BY island_number, lang_id) AS "wordCount",
          lang_id
        FROM numbered_islands
        ORDER BY island_number DESC, lang_id, numbered_islands.created
      )
      SELECT
        translate(first_id::text, '-', '') AS "firstId",
        created, "wordCount",
        translate(lang_id::text, '-', '') AS "langId",
        'words' AS type
      FROM word_groups
      ORDER BY created DESC
      LIMIT ${activityLimit}
    `
  );

  const recent = [
    ...recentArticles.rows,
    ...recentFamilies.rows,
    ...recentLanguages.rows,
    ...recentLanguageTranslations.rows,
    ...recentTranslations.rows,
    ...recentWords.rows
  ];

  recent.forEach(item => {
    item.created = new Date(item.created);
  });

  recent.sort((a, b) => b.created - a.created);

  req.json(recent.slice(0, activityLimit));
}
