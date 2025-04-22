import type { RequestHandler } from 'express';
import pg from 'pg';
const { escapeIdentifier } = pg;

import { makeEstimatePronunciation } from '../sca/estimateIpa.js';
import { SCA } from '../sca/sca.js';

import query, { transact } from '../db/index.js';
import { hasAllStrings, isValidUUID, IQueryError } from '../utils.js';

export const applySCARules: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  if(req.body.categories !== "orth" && req.body.categories !== "phone") {
    res.status(400).json({ message: "Invalid request body." });
    return;
  }
  if(!(req.body.words instanceof Array) || typeof req.body.rules !== "string") {
    res.status(400).json({ message: "Invalid request body." });
  }

  const tableName = escapeIdentifier(
    req.body.categories === "phone" ? "phonology_categories" : "orthography_categories"
  );

  const categories = await query(
    `
      SELECT letter, string_to_array(members, ',') AS members
      FROM ${tableName}
      WHERE lang_id = $1
    `,
    [req.params.id]
  );

  const sca = new SCA(categories.rows);
  const setRulesResult = sca.setRules(req.body.rules);
  if(!setRulesResult.success) {
    res.status(400).json({ message: setRulesResult.message });
    return;
  }
  const rewritten = req.body.words.map((word: string) => sca.applySoundChanges(word));
  res.json(rewritten);
};

export const estimateWordIPA: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  if(typeof req.body.word !== 'string') {
    res.status(400).json({ message: "Invalid request body." });
    return;
  }

  const result = await makeEstimatePronunciation(req.params.id);
  if(!result.success) {
    res.status(400).json({ message: result.message });
    return;
  }
  const estimation = result.estimate(req.body.word);
  if(!estimation.success) {
    res.status(400).json({ message: estimation.message });
  } else {
    res.json(estimation.result);
  }
};

export const getOrthographyCategories: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT letter, string_to_array(members, ',') AS members
      FROM orthography_categories
      WHERE lang_id = $1
    `,
    [req.params.id]
  );
  res.json(value.rows);
};

export const getPhoneCategories: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT letter, string_to_array(members, ',') AS members
      FROM phonology_categories
      WHERE lang_id = $1
    `,
    [req.params.id]
  );
  res.json(value.rows);
};

export const getPhones: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT id, base, type, qualities, is_allophone AS "isAllophone",
             allophone_of AS "allophoneOf", is_foreign AS "isForeign", notes, graph
      FROM phones
      WHERE lang_id = $1
      ORDER BY id DESC
    `,
    [req.params.id]
  );
  res.json(value.rows);
};

export const getPronunciationEstimation: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT letter_replacements AS "letterReplacements", rewrite_rules AS "rewriteRules"
      FROM pronunciation_estimation
      WHERE lang_id = $1
    `,
    [req.params.id]
  );
  if(value.rows.length === 1) {
    res.json(value.rows[0]);
  } else {
    res.json({ letterReplacements: "", rewriteRules: "" });
  }
};

const makeUpdateCategories = (tableName: 'orthography_categories' | 'phonology_categories') => {
  const escapedTableName = escapeIdentifier(tableName);
  const updateFn: RequestHandler = async (req, res, next) => {
    try {
      if(!isValidUUID(req.params.id)) {
        res.status(400).json({ message: "Invalid request body." });
        return;
      }
      if(!(req.body.categories instanceof Array)) {
        res.status(400).json({ message: "Invalid request body." });
        return;
      }
      const lettersSeen: string[] = [];
      for(const category of req.body.categories) {
        if(!/^\p{Lu}$/u.test(category.letter)) {
          res.status(400).json({
            message: "Each category letter must be a single uppercase letter."
          });
          return;
        } else if(lettersSeen.includes(category.letter)) {
          res.status(400).json({ message: "All category letters must be unique." });
          return;
        } else if(!category.members || /^,|,,|,$/.test(category.members)) {
          res.status(400).json({ message: "Each category member must be non-empty." });
          return;
        }
        lettersSeen.push(category.letter);
      }

      await transact(async client => {
        const langId = req.params.id;

        const categories = req.body.categories.map((p: any) => ({
          lang_id: p.langId,
          letter: p.letter,
          members: p.members
        }));
        const categoryLetters = req.body.categories.map((c: any) => c.letter);

        await client.query(
          `
            INSERT INTO ${escapedTableName} (
              lang_id, letter, members
            )
            SELECT
              $1, c.letter, c.members
            FROM json_populate_recordset(NULL::${escapedTableName}, $2) AS c
            ON CONFLICT (lang_id, letter) DO UPDATE
            SET members = EXCLUDED.members
          `,
          [langId, JSON.stringify(categories)]
        );
        await client.query(
          `
            DELETE FROM ${escapedTableName}
            WHERE lang_id = $1 AND NOT (letter = ANY($2::text[]))
          `,
          [langId, categoryLetters]
        );

        req.body.categories.sort(
          (c1: any, c2: any) => c1.letter.localeCompare(c2.letter)
        );
        res.json(req.body.categories);
      });
    } catch(err) {
      if((err as IQueryError).code === '23505') {
        res.status(400).json({ message: "All category letters must be unique." });
      } else {
        next(err);
      }
    }
  };
  return updateFn;
};

export const updateOrthographyCategories = makeUpdateCategories('orthography_categories');

export const updatePhoneCategories = makeUpdateCategories('phonology_categories');

export const updatePhones: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ message: "Invalid request body." });
    return;
  }
  if(!(req.body.new instanceof Array && req.body.deleted instanceof Array)) {
    res.status(400).json({ message: "Invalid request body." });
    return;
  }
  if(req.body.new.some((p: any) => !p.base)) {
    res.status(400).json({ message: "Phones cannot be blank." });
    return;
  }

  await transact(async client => {
    const langId = req.params.id;
    const oldGraphs = (await client.query(
      `SELECT graph FROM phones WHERE lang_id = $1 AND graph != '' ORDER BY graph`,
      [langId]
    )).rows;

    const toAdd = req.body.new.map((p: any) => ({
      id: p.id,
      lang_id: p.langId,
      base: p.base,
      type: p.type,
      qualities: p.qualities,
      is_allophone: p.isAllophone,
      allophone_of: p.allophoneOf,
      is_foreign: p.isForeign,
      notes: p.notes,
      graph: p.graph
    }));
    await client.query(
      `
        INSERT INTO phones (
          id, lang_id, base, type, qualities, is_allophone,
          allophone_of, is_foreign, notes, graph
        )
        SELECT
          COALESCE(p.id, nextval(pg_get_serial_sequence('phones', 'id'))),
          $1, p.base, p.type, p.qualities, p.is_allophone,
          p.allophone_of, p.is_foreign, p.notes, p.graph
        FROM json_populate_recordset(NULL::phones, $2) AS p
        ON CONFLICT (id) DO UPDATE
        SET lang_id = EXCLUDED.lang_id,
            base = EXCLUDED.base,
            type = EXCLUDED.type,
            qualities = EXCLUDED.qualities,
            is_allophone = EXCLUDED.is_allophone,
            allophone_of = EXCLUDED.allophone_of,
            is_foreign = EXCLUDED.is_foreign,
            notes = EXCLUDED.notes,
            graph = EXCLUDED.graph
      `,
      [langId, JSON.stringify(toAdd)]
    );
    await client.query(
      "DELETE FROM phones WHERE id = ANY($1::bigint[])",
      [req.body.deleted]
    );

    const newGraphs = (await client.query(
      "SELECT graph FROM phones WHERE lang_id = $1 AND graph != '' ORDER BY graph",
      [langId]
    )).rows;
    if(oldGraphs.length !== newGraphs.length ||
       oldGraphs.some((g, i) => newGraphs[i].graph !== g.graph)) {
      await client.query(
        `
          UPDATE orthography_settings
          SET alphabetical_order = NULL
          WHERE lang_id = $1
        `,
        [langId]
      );
    }

    const langPhones = await client.query(
      `
        SELECT id, base, type, qualities, is_allophone AS "isAllophone",
               allophone_of AS "allophoneOf", is_foreign AS "isForeign", notes, graph
        FROM phones
        WHERE lang_id = $1
        ORDER BY id DESC
      `,
      [langId]
    );
    res.json(langPhones.rows);
  });
};

export const updatePronunciationEstimation: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ message: "The given language ID is not valid." });
    return;
  }
  if(!hasAllStrings(req.body, ['letterReplacements', 'rewriteRules'])) {
    res.status(400).json({ message: "Invalid request body." });
    return;
  }

  await query(
    `
      INSERT INTO pronunciation_estimation (
        lang_id, letter_replacements, rewrite_rules
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (lang_id) DO UPDATE
      SET letter_replacements = EXCLUDED.letter_replacements,
          rewrite_rules = EXCLUDED.rewrite_rules
    `,
    [req.params.id, req.body.letterReplacements, req.body.rewriteRules]
  );
  res.status(204).send();
};
