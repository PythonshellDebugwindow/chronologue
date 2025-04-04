import type { RequestHandler } from 'express';

import query, { transact } from '../db/index.js';
import { hasAllStrings, isValidUUID, IQueryError } from '../utils.js';

export const addLanguage: RequestHandler = async (req, res, next) => {
  try {
    if(!req.body.name || !hasAllStrings(req.body, ['autonym', 'familyId', 'status', 'era'])) {
      res.status(400).json({ message: "Please provide all required fields." });
      return;
    }
    if(!req.body.familyId && req.body.parentId) {
      res.status(400).json({ message: "Languages with no family cannot have a parent." });
      return;
    }
    
    await transact(async client => {
      if(req.body.parentId) {
        const parentFamily = await client.query(
          `
            SELECT translate(family_id::text, '-', '') AS "familyId"
            FROM languages
            WHERE id = $1
          `,
          [ req.body.parentId ]
        );
        if(parentFamily.rows.length === 0) {
          res.status(400).json({ message: "The given parent language does not exist."});
          return;
        } else if(parentFamily.rows[0].familyId !== req.body.familyId) {
          res.status(400).json({ message: "The given parent language is of a different family."});
          return;
        }
      } else if(req.body.familyId) {
        const languagesInFamily = await client.query(
          `
            SELECT NULL FROM languages
            WHERE family_id = $1 AND parent_id IS NULL
            LIMIT 1
          `,
          [ req.body.familyId ]
        );
        if(languagesInFamily.rows.length > 0) {
          res.status(400).json({ message: "The given family already has a root language." });
          return;
        }
      }

      if(req.body.familyId) {
        const family = await client.query(
          `
            SELECT NULL FROM families
            WHERE id = $1
            LIMIT 1
          `,
          [ req.body.familyId ]
        );
        if(family.rows.length === 0) {
          res.status(400).json({ message: "The given family does not exist." });
          return;
        }
      }

      const value = await client.query(
        `
          INSERT INTO languages (name, autonym, family_id, parent_id, status, era)
                 VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `,
        [ req.body.name, req.body.autonym, req.body.familyId || null, req.body.parentId || null,
          req.body.status, req.body.era ]
      );
      const addedLanguageId = value.rows[0].id.replaceAll("-", "");

      await client.query(
        "INSERT INTO language_summary_notes (lang_id) VALUES ($1)",
        [ addedLanguageId ]
      );
      await client.query(
        "INSERT INTO orthography_settings (lang_id) VALUES ($1)",
        [ addedLanguageId ]
      );
      await client.query(
        "INSERT INTO dictionary_settings (lang_id) VALUES ($1)",
        [ addedLanguageId ]
      );
      
      res.status(201).json(addedLanguageId);
    });
  } catch(err) {
    if((err as IQueryError).code === '23505') {
      res.status(400).json({ message: `The name '${req.body.name}' is already taken.` });
    } else {
      next(err);
    }
  }
};

export const deleteLanguage: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  await transact(async client => {
    const someChild = await client.query(
      `
        SELECT NULL FROM languages
        WHERE parent_id = $1
        LIMIT 1
      `,
      [ req.params.id ]
    );
    if(someChild.rows.length > 0) {
      res.status(400).json({ message: "Cannot delete a language with a child." });
      return;
    }

    await client.query(
      "DELETE FROM languages WHERE id = $1",
      [ req.params.id ]
    );
  });
  
  res.status(204).send();
};

export const editLanguage: RequestHandler = async (req, res, next) => {
  try {
    if(!isValidUUID(req.params.id)) {
      res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
      return;
    }
    if(!req.body.name ||
       !hasAllStrings(req.body, ['autonym', 'status', 'era']) ||
       !('familyId' in req.body && 'parentId' in req.body)) {
      res.status(400).json({ message: "Please provide all required fields." });
      return;
    }
    
    await transact(async client => {
      const langId = req.params.id;

      if(req.body.familyId) {
        if(req.body.parentId) {
          const parentFamily = await client.query(
            `
              SELECT translate(family_id::text, '-', '') AS "familyId"
              FROM languages
              WHERE id = $1
            `,
            [ req.body.parentId ]
          );
          if(parentFamily.rows.length === 0) {
            res.status(400).json({ message: "The given parent language does not exist." });
            return;
          } else if(parentFamily.rows[0].familyId !== req.body.familyId) {
            res.status(400).json({ message: "The given parent language is not in the given family." });
            return;
          }
        } else {
          const languagesInFamily = await client.query(
            `
              SELECT NULL FROM languages
              WHERE family_id = $1 AND parent_id IS NULL AND id != $2
              LIMIT 1
            `,
            [ req.body.familyId, langId ]
          );
          if(languagesInFamily.rows.length > 0) {
            res.status(400).json({ message: "The given family already has a root language." });
            return;
          }
        }
          
        const descendantIds = (await query({
          text: `
            WITH RECURSIVE children AS (
                SELECT id, parent_id
                FROM languages
                WHERE parent_id = $1
              UNION ALL
                SELECT p.id, p.parent_id
                FROM languages p
                INNER JOIN children c ON c.id = p.parent_id
            )
            SELECT
              translate(id::text, '-', '') AS id
            FROM children
          `,
          values: [ langId ],
          rowMode: 'array'
        })).rows.flat();
        if(descendantIds.includes(req.body.parentId)) {
          res.status(400).json({ message: "A language cannot be its own descendant." });
          return;
        }

        await query(
          `
            UPDATE languages
            SET family_id = $1
            WHERE id = ANY($2::uuid[])
          `,
          [ req.body.familyId, descendantIds ]
        );
      }
      
      await client.query(
        `
          UPDATE languages
          SET name = $1, autonym = $2, family_id = $3, parent_id = $4, status = $5, era = $6
          WHERE id = $7
        `,
        [ req.body.name, req.body.autonym, req.body.familyId, req.body.parentId,
          req.body.status, req.body.era, langId ]
      );
    });

    res.status(204).end();
  } catch(err) {
    if((err as IQueryError).code === '23505') {
      res.status(400).json({ message: `The name '${req.body.name}' is already taken.` });
    } else {
      next(err);
    }
  }
};

export const getDescendants: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  
  const value = await query(
    `
      WITH RECURSIVE children AS (
          SELECT id, name, autonym, family_id, parent_id, status, era, created
          FROM languages
          WHERE parent_id = $1
        UNION ALL
          SELECT
            p.id, p.name, p.autonym, p.family_id, p.parent_id,
            p.status, p.era, p.created
          FROM languages p
          INNER JOIN children c ON c.id = p.parent_id
      )
      SELECT
        translate(id::text, '-', '') AS id,
        name, autonym,
        translate(family_id::text, '-', '') AS "familyId",
        translate(parent_id::text, '-', '') AS "parentId",
        status, era, created
      FROM children
    `,
    [ req.params.id ]
  );
  res.json(value.rows);
};

export const getDictionarySettings: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  
  const value = await query(
    `
      SELECT show_word_ipa AS "showWordIpa"
      FROM dictionary_settings
      WHERE lang_id = $1
    `,
    [ req.params.id ]
  );
  if(value.rows.length === 1) {
    res.json(value.rows[0]);
  } else {
    res.status(404).json({ title: "Language not found", message: "The requested language was not found." });
  }
};

export const getLanguage: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  
  const value = await query(
    `
      SELECT name, autonym,
             translate(family_id::text, '-', '') AS "familyId",
             translate(parent_id::text, '-', '') AS "parentId",
             status, era, created
      FROM languages
      WHERE id = $1
    `,
    [ req.params.id ]
  );
  if(value.rows.length === 1) {
    value.rows[0].id = req.params.id;
    res.json(value.rows[0]);
  } else {
    res.status(404).json({ title: "Language not found", message: "The requested language was not found." });
  }
};

export const getOrthographySettings: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  
  const value = await query(
    `
      SELECT COALESCE(
        alphabetical_order,
        ARRAY(
          SELECT DISTINCT graph
          FROM phones
          WHERE lang_id = $1 AND graph != ''
          ORDER BY graph
        )
      ) AS "alphabeticalOrder",
      alphabetical_order IS NOT NULL AS "hasSetAlphabeticalOrder",
      case_sensitive AS "caseSensitive"
      FROM orthography_settings
      WHERE lang_id = $1
    `,
    [ req.params.id ]
  );
  if(value.rows.length === 1 && value.rows[0].hasSetAlphabeticalOrder !== null) {
    res.json(value.rows[0]);
  } else {
    res.status(404).json({ title: "Language not found", message: "The requested language was not found." });
  }
};

export const getSummaryNotes: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  
  const value = await query(
    `
      SELECT description,
             phonology_notes AS "phonologyNotes",
             orthography_notes AS "orthographyNotes"
      FROM language_summary_notes
      WHERE lang_id = $1
    `,
    [ req.params.id ]
  );
  if(value.rows.length === 1) {
    res.json(value.rows[0]);
  } else {
    res.status(404).json({ title: "Language not found", message: "The requested language was not found." });
  }
};

export const updateAlphabeticalOrder: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ message: "The given language ID is not valid." });
    return;
  }
  if(!(req.body.order instanceof Array)) {
    res.status(400).json({ message: "Invalid request body." });
    return;
  }

  await query(
    `
      UPDATE orthography_settings
      SET alphabetical_order = $1
      WHERE lang_id = $2
    `,
    [ req.body.order, req.params.id ]
  );
  res.json(req.body.order);
};

export const updateDictionarySettings: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ message: "The given language ID is not valid." });
    return;
  }
  if(typeof req.body.showWordIpa !== 'boolean') {
    res.status(400).json({ message: "Invalid request body." });
    return;
  }

  await query(
    `
      UPDATE dictionary_settings
      SET show_word_ipa = $1
      WHERE lang_id = $2
    `,
    [ req.body.showWordIpa, req.params.id ]
  );
  res.status(204).send();
};

export const updateOrthographySettings: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ message: "The given language ID is not valid." });
    return;
  }
  if(typeof req.body.caseSensitive !== 'boolean') {
    res.status(400).json({ message: "Invalid request body." });
    return;
  }

  await query(
    `
      UPDATE orthography_settings
      SET case_sensitive = $1
      WHERE lang_id = $2
    `,
    [ req.body.caseSensitive, req.params.id ]
  );
  res.status(204).send();
};

export const updateSummaryNotes: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ message: "The given language ID is not valid." });
    return;
  }
  if(!hasAllStrings(req.body, ['description', 'phonologyNotes', 'orthographyNotes'])) {
    res.status(400).json({ message: "Invalid request body." });
    return;
  }

  await query(
    `
      UPDATE language_summary_notes
      SET description = $1, phonology_notes = $2, orthography_notes = $3
      WHERE lang_id = $4
    `,
    [ req.body.description, req.body.phonologyNotes,
      req.body.orthographyNotes, req.params.id ]
  );
  res.status(204).end();
};
