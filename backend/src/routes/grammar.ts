import type { RequestHandler } from 'express';

import query, { transact } from '../db/index.js';
import { IQueryError, isValidUUID, partsOfSpeech } from '../utils.js';

export const getGrammarForms: RequestHandler = async (req, res) => {
  const value = await query(
    "SELECT id, code, name FROM grammar_forms"
  );
  res.json(value.rows);
}

export const getIrregularForms: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given table ID is not valid." });
    return;
  }
  if(!isValidUUID(req.params.word)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT row_index AS "row", column_index AS "column", form
      FROM grammar_table_irregular_forms
      WHERE table_id = $1 AND word_id = $2
    `,
    [req.params.id, req.params.word]
  );
  res.json(value.rows);
}

export const getIrregularStemsForWord: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT stem_id AS "stemId", form
      FROM word_stems_irregular
      WHERE word_id = $1
    `,
    [req.params.id]
  );
  const result: { [stemId: string]: string } = {};
  for(const row of value.rows) {
    result[row.stemId] = row.form;
  }
  res.json(result);
}

export const getLanguageIrregularForms: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT
        translate(gt.id::text, '-', '') AS "tableId",
        gt.name AS "tableName",
        gt.pos AS "tablePos",
        gt.rows[if.row_index + 1] AS "rowName",
        gt.columns[if.column_index + 1] AS "columnName",
        if.form,
        translate(if.word_id::text, '-', '') AS "wordId",
        coalesce(w.word, '') AS word
      FROM grammar_tables AS gt
      JOIN grammar_table_irregular_forms AS if ON gt.id = if.table_id
      LEFT JOIN words AS w ON w.id = if.word_id
      WHERE gt.lang_id = $1
    `,
    [req.params.id]
  );
  res.json(value.rows);
}

export const getLanguageWordStems: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT id, pos, name, rules
      FROM word_stems
      WHERE lang_id = $1
      ORDER BY pos, name
    `,
    [req.params.id]
  );
  res.json(value.rows);
}

export const getLanguageWordStemsByPos: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  if(!partsOfSpeech.some(pos => req.params.pos === pos.code)) {
    res.status(400).json({ title: "Invalid POS", message: "The given POS is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT id, name
      FROM word_stems
      WHERE lang_id = $1 AND pos = $2
      ORDER BY name
    `,
    [req.params.id, req.params.pos]
  );
  res.json(value.rows);
}

export const updateGrammarForms: RequestHandler = async (req, res, next) => {
  try {
    if(!(req.body.new instanceof Array && req.body.deleted instanceof Array)) {
      res.status(400).json({ message: "Invalid request body." });
      return;
    }
    for(const cls of req.body.new) {
      if(!cls.code) {
        res.status(400).json({ message: "All grammar forms must have a code." });
        return;
      } else if(!cls.name) {
        res.status(400).json({ message: "All grammar forms must have a name." });
        return;
      } else if(cls.code === "Ø") {
        res.status(400).json({ message: "The code 'Ø' is reserved." });
        return;
      } else if(!/^(?:\p{Lu}|\p{N})+$/u.test(cls.code)) {
        res.status(400).json({
          message: `Invalid code '${cls.code}': must be alphanumeric with no lowercase letters.`
        });
        return;
      }
    }

    await transact(async client => {
      await client.query(
        `
          INSERT INTO grammar_forms (
            id, code, name
          )
          SELECT
            COALESCE(p.id, nextval(pg_get_serial_sequence('grammar_forms', 'id'))),
            p.code, p.name
          FROM json_populate_recordset(NULL::grammar_forms, $1) AS p
          ON CONFLICT (id) DO UPDATE
          SET
            code = EXCLUDED.code,
            name = EXCLUDED.name
        `,
        [JSON.stringify(req.body.new)]
      );
      await client.query(
        "DELETE FROM grammar_forms WHERE id = ANY($1::bigint[])",
        [req.body.deleted]
      );

      const newGrammarForms = await client.query(
        `
          SELECT id, code, name
          FROM grammar_forms
          ORDER BY code
        `
      );
      res.json(newGrammarForms.rows);
    });
  } catch(err) {
    if((err as IQueryError).code === '23505') {
      res.status(400).json({ message: "All grammar form codes must be unique." });
    } else {
      next(err);
    }
  }
}

export const updateIrregularForms: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given table ID is not valid." });
    return;
  }
  if(!isValidUUID(req.params.word)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }
  if(!(req.body.cells instanceof Array)) {
    res.status(400).json({ message: "Please provide all required fields." });
    return;
  }

  const tableId = req.params.id;
  const wordId = req.params.word;
  const cells = (req.body.cells as string[][]).flatMap((row, i) => (
    row.flatMap((cell, j) => cell ? [{
      table_id: tableId,
      word_id: wordId,
      row_index: i,
      column_index: j,
      form: cell
    }] : [])
  ));
  const cellPosRows = cells.map(cell => cell.row_index);
  const cellPosColumns = cells.map(cell => cell.column_index);

  await transact(async client => {
    await client.query(
      `
        DELETE FROM grammar_table_irregular_forms
        WHERE table_id = $1 AND word_id = $2 AND NOT (
          (row_index, column_index) = ANY(
            SELECT * FROM unnest($3::integer[], $4::integer[])
          )
        )
      `,
      [tableId, wordId, cellPosRows, cellPosColumns]
    );
    if(cells.length > 0) {
      await client.query(
        `
          INSERT INTO grammar_table_irregular_forms (
            table_id, word_id, row_index, column_index, form
          )
          SELECT c.table_id, c.word_id, c.row_index, c.column_index, c.form
          FROM json_populate_recordset(NULL::grammar_table_irregular_forms, $1) AS c
          ON CONFLICT (table_id, word_id, row_index, column_index) DO UPDATE
          SET form = EXCLUDED.form
        `,
        [JSON.stringify(cells)]
      );
    }
  });

  res.status(204).send();
}

export const updateLanguageWordStems: RequestHandler = async (req, res, next) => {
  try {
    if(!isValidUUID(req.params.id)) {
      res.status(400).json({ message: "The given language ID is not valid." });
      return;
    }
    if(!(req.body.new instanceof Array && req.body.deleted instanceof Array)) {
      res.status(400).json({ message: "Invalid request body." });
      return;
    }
    for(const stem of req.body.new) {
      if(!stem.name) {
        res.status(400).json({ message: "All stems must have a name." });
        return;
      } else if(!partsOfSpeech.some(pos => stem.pos === pos.code)) {
        res.status(400).json({
          message: `Invalid part of speech '${stem.pos}'.`
        });
        return;
      }
    }

    const langId = req.params.id;
    const toAdd = req.body.new.map((stem: any) => ({
      id: stem.id,
      lang_id: langId,
      pos: stem.pos,
      name: stem.name,
      rules: stem.rules
    }));

    await transact(async client => {
      await client.query(
        `
          INSERT INTO word_stems (
            id, lang_id, pos, name, rules
          )
          SELECT
            COALESCE(p.id, nextval(pg_get_serial_sequence('word_stems', 'id'))),
            $1, p.pos, p.name, p.rules
          FROM json_populate_recordset(NULL::word_stems, $2) AS p
          ON CONFLICT (id) DO UPDATE
          SET
            name = EXCLUDED.name,
            rules = EXCLUDED.rules
        `,
        [langId, JSON.stringify(toAdd)]
      );
      await client.query(
        "DELETE FROM word_stems WHERE id = ANY($1::bigint[])",
        [req.body.deleted]
      );

      const langWordStems = await client.query(
        `
          SELECT id, pos, name, rules
          FROM word_stems
          WHERE lang_id = $1
          ORDER BY pos, name
        `,
        [langId]
      );
      res.json(langWordStems.rows);
    });
  } catch(err) {
    if((err as IQueryError).code === '23505') {
      res.status(400).json({ message: "All stem names must be unique for a given part of speech." });
    } else {
      next(err);
    }
  }
}
