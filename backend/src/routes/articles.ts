import type { RequestHandler } from 'express';

import query, { transact } from '../db/index.js';
import { IQueryError, isValidUUID } from '../utils.js';

export const addArticle: RequestHandler = async (req, res) => {
  if(!req.body.title || !req.body.content || !(req.body.tags instanceof Array)) {
    res.status(400).json({ message: "Please provide all required fields." });
    return;
  }

  await transact(async client => {
    const added = await client.query(
      `
        INSERT INTO articles (title, content, folder_id)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [req.body.title, req.body.content, req.body.folderId]
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
        SET title = $1, content = $2, folder_id = $3, updated = CURRENT_TIMESTAMP
        WHERE id = $4
      `,
      [req.body.title, req.body.content, req.body.folderId, articleId]
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
        title, content, folder_id AS "folderId",
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
        title, content, folder_id AS "folderId", created, updated,
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

export const getArticleFolders: RequestHandler = async (req, res) => {
  const folders = await query(
    "SELECT id, name FROM article_folders"
  );
  res.json(folders.rows);
}

export const getExistingTags: RequestHandler = async (req, res) => {
  const tags = await query({
    text: "SELECT DISTINCT tag FROM article_tags",
    rowMode: 'array'
  });
  res.json(tags.rows.flat().sort());
}

export const updateArticleFolders: RequestHandler = async (req, res, next) => {
  try {
    if(!(req.body.new instanceof Array && req.body.deleted instanceof Array)) {
      res.status(400).json({ message: "Invalid request body." });
      return;
    }
    for(const folder of req.body.new) {
      if(!folder.name) {
        res.status(400).json({ message: "All folders must have a name." });
        return;
      }
    }

    const folders = await transact(async client => {
      await client.query(
        `
          INSERT INTO article_folders (id, name)
          SELECT
            COALESCE(f.id, nextval(pg_get_serial_sequence('article_folders', 'id'))),
            f.name
          FROM json_populate_recordset(NULL::article_folders, $1) AS f
          ON CONFLICT (id) DO UPDATE
          SET name = EXCLUDED.name
        `,
        [JSON.stringify(req.body.new)]
      );
      await client.query(
        "DELETE FROM article_folders WHERE id = ANY($1::bigint[])",
        [req.body.deleted]
      );

      const newFolders = await client.query(
        `
          SELECT id, name
          FROM article_folders
          ORDER BY name
        `
      );
      return newFolders.rows;
    });
    res.json(folders);
  } catch(err) {
    if((err as IQueryError).code === '23505') {
      res.status(400).json({ message: "All folder names must be unique." });
    } else {
      next(err);
    }
  }
}
