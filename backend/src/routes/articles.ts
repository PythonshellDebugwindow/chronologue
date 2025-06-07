import type { RequestHandler } from 'express';

import query, { transact } from '../db/index.js';
import { isValidUUID } from '../utils.js';

export const addArticle: RequestHandler = async (req, res) => {
  if(!req.body.title || !req.body.content || !(req.body.tags instanceof Array)) {
    res.status(400).json({ message: "Please provide all required fields." });
    return;
  }

  await transact(async client => {
    const added = await client.query(
      "INSERT INTO articles (title, content) VALUES ($1, $2) RETURNING id",
      [req.body.title, req.body.content]
    );
    const addedId = added.rows[0].id.replaceAll("-", "");

    await client.query(
      `
        INSERT INTO article_tags (article_id, tag)
        SELECT $1, unnest($2::text[])
      `,
      [addedId, req.body.tags]
    );

    res.status(201).json(addedId);
  });
}

export const deleteArticle: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given article ID is not valid." });
    return;
  }

  await query(
    "DELETE FROM articles WHERE id = $1",
    [req.params.id]
  );

  res.status(204).send();
}

export const editArticle: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given article ID is not valid." });
    return;
  }
  if(!req.body.title || typeof req.body.content !== 'string' ||
     !(req.body.tags instanceof Array)) {
    res.status(400).json({ message: "Please provide all required fields." });
    return;
  }

  const articleId = req.params.id;

  await transact(async client => {
    await client.query(
      `
        UPDATE articles
        SET title = $1, content = $2, updated = CURRENT_TIMESTAMP
        WHERE id = $3
      `,
      [req.body.title, req.body.content, articleId]
    );

    await client.query(
      `
        DELETE FROM article_tags
        WHERE article_id = $1 AND NOT (tag = ANY($2::text[]))
      `,
      [articleId, req.body.tags]
    );
    if(req.body.tags.length > 0) {
      await client.query(
        `
          INSERT INTO article_tags (article_id, tag)
          SELECT $1, unnest($2::text[])
          ON CONFLICT DO NOTHING
        `,
        [articleId, req.body.tags]
      );
    }
  });

  res.status(204).send();
}

export const getAllArticles: RequestHandler = async (req, res) => {
  const articles = await query(
    `
      SELECT
        translate(id::text, '-', '') AS id,
        title, content,
        coalesce(updated, created) AS updated,
        coalesce(array_agg(tag) FILTER (WHERE tag IS NOT NULL), '{}') AS tags
      FROM articles AS a
      LEFT JOIN article_tags AS at
      ON a.id = at.article_id
      GROUP BY a.id
      ORDER BY coalesce(updated, created) DESC
    `
  );
  res.json(articles.rows);
}

export const getArticle: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given article ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT
        title, content, created, updated,
        coalesce(array_agg(tag) FILTER (WHERE tag IS NOT NULL), '{}') AS tags
      FROM articles AS a
      LEFT JOIN article_tags AS at
      ON a.id = at.article_id
      WHERE a.id = $1
      GROUP BY a.id
    `,
    [req.params.id]
  );
  if(value.rows.length === 1) {
    value.rows[0].id = req.params.id;
    res.json(value.rows[0]);
  } else {
    res.status(404).json({
      title: "Article not found", message: "The requested article was not found."
    });
  }
}

export const getExistingTags: RequestHandler = async (req, res) => {
  const tags = await query({
    text: "SELECT DISTINCT tag FROM article_tags",
    rowMode: 'array'
  });
  res.json(tags.rows.flat().sort());
}
