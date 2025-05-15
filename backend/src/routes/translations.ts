import type { RequestHandler } from 'express';

import query from '../db/index.js';
import { isValidUUID } from '../utils.js';

export const addTranslation: RequestHandler = async (req, res) => {
  if(!req.body.content || !(typeof req.body.notes === 'string')) {
    res.status(400).json({ message: "Please provide all required fields." });
    return;
  }

  const value = await query(
    `
      INSERT INTO translations (content, notes)
      VALUES ($1, $2)
      RETURNING id
    `,
    [req.body.content, req.body.notes]
  );
  res.status(201).json(value.rows[0].id.replaceAll("-", ""));
};

export const deleteTranslation: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({
      title: "Invalid ID", message: "The given translation ID is not valid."
    });
    return;
  }

  await query(
    "DELETE FROM translations WHERE id = $1",
    [req.params.id]
  );
  res.status(204).send();
};

export const editTranslation: RequestHandler = async (req, res, next) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({
      title: "Invalid ID", message: "The given translation ID is not valid."
    });
    return;
  }
  if(!req.body.content || !(typeof req.body.notes === 'string')) {
    res.status(400).json({ message: "Please provide all required fields." });
    return;
  }

  await query(
    `
      UPDATE translations
      SET content = $1, notes = $2
      WHERE id = $3
    `,
    [req.body.content, req.body.notes, req.params.id]
  );

  res.status(204).send();
};

export const getAllTranslations: RequestHandler = async (req, res) => {
  const value = await query(
    `
      SELECT
        translate(id::text, '-', '') AS id,
        content,
        created,
        (
          SELECT count(*) FROM language_translations AS lt WHERE lt.transl_id = id
        ) AS "numLanguages"
      FROM translations
      ORDER BY created DESC
    `
  );
  res.json(value.rows);
};

export const getLanguageTranslationIds: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  const value = await query({
    text: `
      SELECT translate(transl_id::text, '-', '')
      FROM language_translations
      WHERE lang_id = $1
    `,
    values: [req.params.id],
    rowMode: 'array'
  });
  res.json(value.rows.flat());
};

export const getTranslation: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given translation ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT content, notes, created
      FROM translations
      WHERE id = $1
    `,
    [req.params.id]
  );
  if(value.rows.length === 1) {
    value.rows[0].id = req.params.id;
    res.json(value.rows[0]);
  } else {
    res.status(404).json({
      title: "Translation not found", message: "The requested translation was not found."
    });
  }
};

export const getTranslationLanguages: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given translation ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT
        translate(lang_id::text, '-', '') AS "langId",
        content, ipa, gloss, notes,
        work_in_progress AS "workInProgress",
        created
      FROM language_translations
      WHERE transl_id = $1
    `,
    [req.params.id]
  );
  res.json(value.rows);
};
