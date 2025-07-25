import type { RequestHandler } from 'express';
import pg from 'pg';
const { escapeIdentifier } = pg;

import query, { transact } from '../db/index.js';
import { updateWordDerivationsTable } from '../utils/words.js';
import { hasAllStrings, IQueryError, isValidUUID, partsOfSpeech } from '../utils.js';

export const deleteDerivationRules: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  if(!isValidUUID(req.params.srcId)) {
    res.status(400).json({
      title: "Invalid ID", message: "The given source language ID is not valid."
    });
    return;
  }

  await query(
    `
      DELETE FROM language_derivation_rules
      WHERE dest_lang_id = $1 AND src_lang_id = $2
    `,
    [req.params.id, req.params.srcId]
  );
  res.status(204).send();
}

export const editDerivationRules: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  if(!isValidUUID(req.params.srcId)) {
    res.status(400).json({
      title: "Invalid ID", message: "The given source language ID is not valid."
    });
    return;
  }
  if(typeof req.body.rules !== 'string' || typeof req.body.fromIpa !== 'boolean') {
    res.status(400).json({ message: "Please provide all required fields." });
    return;
  }

  await query(
    `
      INSERT INTO language_derivation_rules (
        dest_lang_id, src_lang_id, rules, from_ipa
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (dest_lang_id, src_lang_id) DO UPDATE
      SET
        rules = EXCLUDED.rules,
        from_ipa = EXCLUDED.from_ipa
    `,
    [req.params.id, req.params.srcId, req.body.rules, req.body.fromIpa]
  );
  res.status(204).send();
}

export const getDerivationRules: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  if(!isValidUUID(req.params.srcId)) {
    res.status(400).json({ title: "Invalid ID", message: "The given source language ID is not valid." });
    return;
  }

  const rules = await query(
    `
      SELECT rules, from_ipa AS "fromIpa"
      FROM language_derivation_rules
      WHERE dest_lang_id = $1 AND src_lang_id = $2
    `,
    [req.params.id, req.params.srcId]
  );
  res.json(rules.rows.length === 1 ? rules.rows[0] : null);
}

export const getLanguageDerivationRulesets: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  const rulesets = await query(
    `
      SELECT
        translate(ldr.src_lang_id::text, '-', '') AS "langId",
        lg.name AS "langName",
        translate(f.id::text, '-', '') AS "familyId",
        f.name AS "familyName",
        ldr.from_ipa AS "fromIpa"
      FROM language_derivation_rules AS ldr
      LEFT JOIN languages AS lg ON ldr.src_lang_id = lg.id
      LEFT JOIN families AS f ON lg.family_id = f.id
      WHERE ldr.dest_lang_id = $1
      ORDER BY f.name, lg.name
    `,
    [req.params.id]
  );
  res.json(rulesets.rows);
}

export const getLanguageStringHomonyms: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  if(typeof req.body.word !== 'string') {
    res.status(400).json({ message: "Please provide all required fields." });
    return;
  }

  const homonyms = await query(
    `
      SELECT translate(id::text, '-', '') AS id, word, meaning, pos
      FROM words
      WHERE lang_id = $1 AND lower(word) = lower($2)
      ORDER BY pos, meaning
    `,
    [req.params.id, req.body.word]
  );
  res.json(homonyms.rows);
}

export const getLanguageStringSynonyms: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  if(typeof req.body.meaning !== 'string') {
    res.status(400).json({ message: "Please provide all required fields." });
    return;
  }

  const synonyms = await query(
    `
      SELECT translate(id::text, '-', '') AS id, word, meaning, pos
      FROM words
      WHERE lang_id = $1 AND meaning = $2
      ORDER BY pos, word
    `,
    [req.params.id, req.body.meaning]
  );
  res.json(synonyms.rows);
}

export const getLanguageWords: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT
        translate(id::text, '-', '') AS id,
        word, ipa, meaning, pos, etymology, notes, created, updated
      FROM words
      WHERE lang_id = $1
    `,
    [req.params.id]
  );
  res.json(value.rows);
}

export const getLanguageWordsWithClasses: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT
        translate(w.id::text, '-', '') AS id,
        w.word, w.ipa, w.meaning, w.pos, w.etymology, w.notes, w.created, w.updated,
        coalesce(
          array_agg(wc.code ORDER BY wc.code) FILTER (WHERE wc.code IS NOT NULL), '{}'
        ) AS classes
      FROM words AS w
      LEFT JOIN word_classes_by_word AS bw ON bw.word_id = w.id
      LEFT JOIN word_classes AS wc ON wc.id = bw.class_id
      WHERE w.lang_id = $1
      GROUP BY w.id
    `,
    [req.params.id]
  );
  res.json(value.rows);
}

export const getLanguageWordCount: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT COUNT(*)
      FROM words
      WHERE lang_id = $1
    `,
    [req.params.id]
  );
  if(value.rows.length === 1) {
    res.json(value.rows[0].count);
  } else {
    res.status(404).json({
      title: "Language not found", message: "The requested language was not found."
    });
  }
}

export const getPartsOfSpeech: RequestHandler = async (req, res) => {
  res.json(partsOfSpeech);
}

export const getWordClassesByLanguage: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT id, pos, code, name
      FROM word_classes
      WHERE lang_id = $1
      ORDER BY code
    `,
    [req.params.id]
  );
  res.json(value.rows);
}

export const importWords: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ message: "The given language ID is not valid." });
    return;
  }
  if(!(req.body.words instanceof Array)) {
    res.status(400).json({ message: "Invalid request body." });
    return;
  }
  for(const word of req.body.words) {
    if(!word.word || !word.meaning || !word.pos ||
       !hasAllStrings(word, ['ipa', 'etymology', 'notes']) ||
       !(word.classes instanceof Array)) {
      res.status(400).json({ message: "Invalid word in request body." });
      return;
    }
  }

  const langId = req.params.id;
  const words = req.body.words;

  await transact(async client => {
    const wordClassesQuery = await client.query(
      `
        SELECT id, pos, code
        FROM word_classes
        WHERE lang_id = $1
      `,
      [langId]
    );
    const wordClasses = wordClassesQuery.rows;

    for(const word of words) {
      const hasInvalidWordClass = word.classes.some((cls: string) => (
        !wordClasses.some(wc => wc.id === cls && wc.pos === word.pos)
      ));
      if(hasInvalidWordClass) {
        res.status(400).json({ message: "Invalid word class for POS." });
        return;
      }
    }

    const importQuery = await client.query(
      `
        INSERT INTO words (
          word, ipa, meaning, pos, etymology, notes, lang_id
        )
        SELECT w.word, w.ipa, w.meaning, w.pos, w.etymology, w.notes, $1
        FROM json_populate_recordset(NULL::words, $2) AS w
        RETURNING id
      `,
      [langId, JSON.stringify(words)]
    );
    const addedIds = importQuery.rows;

    const wordClassesByWord = words.flatMap((word: any, i: number) => word.classes.map(
      (cls: string) => ({ word_id: addedIds[i].id, class_id: cls })
    ));
    await client.query(
      `
        INSERT INTO word_classes_by_word (
          word_id, class_id
        )
        SELECT wc.word_id, wc.class_id
        FROM json_populate_recordset(NULL::word_classes_by_word, $1) AS wc
      `,
      [JSON.stringify(wordClassesByWord)]
    );

    for(let i = 0; i < addedIds.length; ++i) {
      if(words[i].etymology) {
        await updateWordDerivationsTable(addedIds[i].id, words[i].etymology, true, client);
      }
    }
  });

  res.status(204).send();
}

export const massEditLanguageDictionary: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ message: "The given language ID is not valid." });
    return;
  }
  if(!req.body.changes ||
     !['word', 'meaning', 'ipa', 'etymology', 'notes'].includes(req.body.field)) {
    res.status(400).json({ message: "Invalid request body." });
    return;
  }

  const changes = req.body.changes;
  const changedIds = Object.keys(changes);
  const changedFields = changedIds.map(id => changes[id]);

  if(req.body.field === 'word' || req.body.field === 'meaning') {
    if(changedFields.some(f => f.length === 0)) {
      res.status(400).json({ message: `Words cannot have an empty ${req.body.field} field.` });
      return;
    }
  }

  const escapedField = escapeIdentifier(req.body.field);

  await transact(async client => {
    await query(
      `
        UPDATE words
        SET
          ${escapedField} = updates.field,
          updated = CURRENT_TIMESTAMP
        FROM (SELECT unnest($1::uuid[]) AS id, unnest($2::text[]) AS field) AS updates
        WHERE words.id = updates.id
      `,
      [changedIds, changedFields]
    );

    if(req.body.field === 'etymology') {
      for(const wordId of changedIds) {
        await updateWordDerivationsTable(wordId, changes[wordId], false, client);
      }
    }
  });

  res.status(204).send();
}

export const purgeLanguageDictionary: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  await query(
    `
      DELETE FROM words
      WHERE lang_id = $1
    `,
    [req.params.id]
  );
  res.status(204).send();
}

export const updateWordClasses: RequestHandler = async (req, res, next) => {
  try {
    if(!isValidUUID(req.params.id)) {
      res.status(400).json({ message: "The given language ID is not valid." });
      return;
    }
    if(!(req.body.new instanceof Array && req.body.deleted instanceof Array)) {
      res.status(400).json({ message: "Invalid request body." });
      return;
    }
    for(const cls of req.body.new) {
      if(!cls.code) {
        res.status(400).json({ message: "All classes must have a code." });
        return;
      } else if(!cls.name) {
        res.status(400).json({ message: "All classes must have a name." });
        return;
      } else if(cls.code.length > 5) {
        res.status(400).json({
          message: `Invalid code '${cls.code}': must be at most 5 characters long.`
        });
        return;
      } else if(!/^(?:\p{L}\p{M}?|\p{N})+$/u.test(cls.code)) {
        res.status(400).json({
          message: `Invalid code '${cls.code}': must be alphanumeric.`
        });
        return;
      } else if(!partsOfSpeech.some(pos => cls.pos === pos.code)) {
        res.status(400).json({
          message: `Invalid part of speech '${cls.pos}'.`
        });
        return;
      }
    }

    const langId = req.params.id;
    const toAdd = req.body.new.map((cls: any) => ({
      id: cls.id,
      lang_id: langId,
      pos: cls.pos,
      code: cls.code,
      name: cls.name
    }));

    await transact(async client => {
      await client.query(
        `
          INSERT INTO word_classes (
            id, lang_id, pos, code, name
          )
          SELECT
            COALESCE(p.id, nextval(pg_get_serial_sequence('word_classes', 'id'))),
            $1, p.pos, p.code, p.name
          FROM json_populate_recordset(NULL::word_classes, $2) AS p
          ON CONFLICT (id) DO UPDATE
          SET
            code = EXCLUDED.code,
            name = EXCLUDED.name
        `,
        [langId, JSON.stringify(toAdd)]
      );
      await client.query(
        "DELETE FROM word_classes WHERE id = ANY($1::bigint[])",
        [req.body.deleted]
      );

      const langWordClasses = await client.query(
        `
          SELECT id, pos, code, name
          FROM word_classes
          WHERE lang_id = $1
          ORDER BY pos, code
        `,
        [langId]
      );
      res.json(langWordClasses.rows);
    });
  } catch(err) {
    if((err as IQueryError).code === '23505') {
      res.status(400).json({ message: "All class codes must be unique for a given part of speech." });
    } else {
      next(err);
    }
  }
}
