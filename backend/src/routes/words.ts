import type { RequestHandler } from 'express';
import pg from 'pg';
const { escapeIdentifier } = pg;

import { SCA } from '../sca/sca.js';

import query, { transact } from '../db/index.js';
import { hasAllStrings, IQueryError, isValidUUID, partsOfSpeech } from '../utils.js';

export const addWord: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.body.langId)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  if(!req.body.word || !req.body.meaning || !req.body.pos ||
     !hasAllStrings(req.body, ['ipa', 'etymology', 'notes']) ||
     !(req.body.classIds instanceof Array)) {
    res.status(400).json({ message: "Please provide all required fields." });
    return;
  }

  await transact(async client => {
    if(!partsOfSpeech.some(pos => req.body.pos === pos.code)) {
      res.status(400).json({ message: "Please provide a valid part of speech." });
      return;
    }

    const value = await client.query(
      `
        INSERT INTO words (word, ipa, meaning, pos, etymology, notes, lang_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [
        req.body.word, req.body.ipa, req.body.meaning, req.body.pos,
        req.body.etymology, req.body.notes, req.body.langId
      ]
    );
    const addedId = value.rows[0].id.replaceAll("-", "");

    if(req.body.classIds.length > 0) {
      await client.query(
        `
          INSERT INTO word_classes_by_word (word_id, class_id)
          SELECT $1, unnest($2::bigint[])
        `,
        [addedId, req.body.classIds]
      );
    }

    if(req.body.irregularStems) {
      const allIrregularStems = req.body.irregularStems;
      const filledStemIds = Object.keys(allIrregularStems).filter(
        id => allIrregularStems[id]
      );
      const filledIrregularStems = filledStemIds.map(stemId => ({
        word_id: addedId,
        stem_id: stemId,
        form: allIrregularStems[stemId]
      }));
      await client.query(
        `
          INSERT INTO word_stems_irregular (word_id, stem_id, form)
          SELECT wsi.word_id, wsi.stem_id, wsi.form
          FROM json_populate_recordset(NULL::word_stems_irregular, $1) AS wsi
        `,
        [JSON.stringify(filledIrregularStems)]
      );
    }

    res.status(201).json(addedId);
  });
}

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

export const deleteWord: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }

  await query(
    "DELETE FROM words WHERE id = $1",
    [req.params.id]
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

export const editWord: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }
  if(!req.body.word || !req.body.meaning || !req.body.pos ||
     !hasAllStrings(req.body, ['ipa', 'etymology', 'notes']) ||
     !(req.body.classIds instanceof Array)) {
    res.status(400).json({ message: "Please provide all required fields." });
    return;
  }
  if(!partsOfSpeech.some(pos => req.body.pos === pos.code)) {
    res.status(400).json({ message: "Please provide a valid part of speech." });
    return;
  }

  const wordId = req.params.id;

  await transact(async client => {
    await client.query(
      `
        UPDATE words
        SET
          word = $1, ipa = $2, meaning = $3, pos = $4, etymology = $5, notes = $6,
          updated = CURRENT_TIMESTAMP
        WHERE id = $7
      `,
      [
        req.body.word, req.body.ipa, req.body.meaning, req.body.pos,
        req.body.etymology, req.body.notes, wordId
      ]
    );

    await client.query(
      `
        DELETE FROM word_classes_by_word
        WHERE word_id = $1 AND NOT (class_id = ANY($2::bigint[]))
      `,
      [wordId, req.body.classIds]
    );
    if(req.body.classIds.length > 0) {
      await client.query(
        `
          INSERT INTO word_classes_by_word (word_id, class_id)
          SELECT $1, unnest($2::bigint[])
          ON CONFLICT DO NOTHING
        `,
        [wordId, req.body.classIds]
      );
    }

    if(req.body.irregularStems) {
      const allIrregularStems = req.body.irregularStems;
      const filledStemIds = Object.keys(allIrregularStems).filter(
        id => allIrregularStems[id]
      );
      const filledIrregularStems = filledStemIds.map(stemId => ({
        word_id: wordId,
        stem_id: stemId,
        form: allIrregularStems[stemId]
      }));
      await client.query(
        `
          DELETE FROM word_stems_irregular
          WHERE word_id = $1 AND NOT (stem_id = ANY($2::bigint[]))
        `,
        [wordId, filledStemIds]
      );
      await client.query(
        `
          INSERT INTO word_stems_irregular (word_id, stem_id, form)
          SELECT wsi.word_id, wsi.stem_id, wsi.form
          FROM json_populate_recordset(NULL::word_stems_irregular, $1) AS wsi
          ON CONFLICT (word_id, stem_id) DO UPDATE
          SET form = EXCLUDED.form
        `,
        [JSON.stringify(filledIrregularStems)]
      );
    }
  });

  res.status(204).send();
}

export const getDerivationIntoLanguage: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }
  if(!isValidUUID(req.params.langId)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  await transact(async client => {
    const wordQuery = await client.query(
      `
        SELECT lang_id AS "langId", word, ipa
        FROM words
        WHERE id = $1
      `,
      [req.params.id]
    );
    if(wordQuery.rows.length !== 1) {
      res.status(404).json({ message: "The requested word was not found." });
      return;
    }

    const word = wordQuery.rows[0];

    const rulesetQuery = await client.query(
      `
        SELECT rules, from_ipa AS "fromIpa"
        FROM language_derivation_rules
        WHERE dest_lang_id = $1 AND src_lang_id = $2
      `,
      [req.params.langId, word.langId]
    );
    if(rulesetQuery.rows.length !== 1) {
      res.json({ derived: null });
      return;
    }

    const ruleset = rulesetQuery.rows[0];

    const tableName = escapeIdentifier(
      ruleset.fromIpa ? "phonology_categories" : "orthography_categories"
    );

    const categoriesQuery = await client.query(
      `
        SELECT letter, string_to_array(members, ',') AS members
        FROM ${tableName}
        WHERE lang_id = $1
      `,
      [word.langId]
    );

    const sca = new SCA(categoriesQuery.rows);
    const setRulesResult = sca.setRules(ruleset.rules);
    if(!setRulesResult.success) {
      res.json({ derived: setRulesResult });
      return;
    }
    const scaResult = sca.applySoundChanges(ruleset.fromIpa ? word.ipa : word.word);
    res.json({ derived: scaResult });
  });
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

export const getLanguageWordHomonyms: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }

  await transact(async client => {
    const wordResponse = await client.query(
      "SELECT word, lang_id FROM words WHERE id = $1",
      [req.params.id]
    );
    if(wordResponse.rows.length !== 1) {
      res.status(400).json({ message: "The requested word was not found." });
      return;
    }
    const word = wordResponse.rows[0];

    const homonymsResponse = await client.query(
      `
        SELECT translate(id::text, '-', '') AS id, word, meaning, pos
        FROM words
        WHERE lang_id = $1 AND lower(word) = lower($2) AND id != $3
        ORDER BY pos, meaning
      `,
      [word.lang_id, word.word, req.params.id]
    );
    res.json(homonymsResponse.rows);
  });
}

export const getLanguageWordSynonyms: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }

  await transact(async client => {
    const wordResponse = await client.query(
      "SELECT meaning, lang_id FROM words WHERE id = $1",
      [req.params.id]
    );
    if(wordResponse.rows.length !== 1) {
      res.status(400).json({ message: "The requested word was not found." });
      return;
    }
    const word = wordResponse.rows[0];

    const synonymsResponse = await client.query(
      `
        SELECT translate(id::text, '-', '') AS id, word, meaning, pos
        FROM words
        WHERE lang_id = $1 AND meaning = $2 AND id != $3
        ORDER BY pos, word
      `,
      [word.lang_id, word.meaning, req.params.id]
    );
    res.json(synonymsResponse.rows);
  });
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

export const getWord: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT
        word, ipa, meaning, pos, etymology, notes,
        translate(lang_id::text, '-', '') AS "langId",
        created, updated
      FROM words
      WHERE id = $1
    `,
    [req.params.id]
  );
  if(value.rows.length === 1) {
    value.rows[0].id = req.params.id;
    res.json(value.rows[0]);
  } else {
    res.status(404).json({
      title: "Word not found", message: "The requested word was not found."
    });
  }
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

export const getWordClassIdsByWord: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }

  const value = await query({
    text: `
      SELECT wc.id
      FROM word_classes_by_word AS bw
      INNER JOIN word_classes AS wc
      ON bw.class_id = wc.id
      WHERE bw.word_id = $1
    `,
    values: [req.params.id],
    rowMode: 'array'
  });
  res.json(value.rows.flat());
}

export const getWordClassesByWord: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT wc.id, wc.code, wc.name
      FROM word_classes_by_word AS bw
      INNER JOIN word_classes AS wc
      ON bw.class_id = wc.id
      WHERE bw.word_id = $1
      ORDER BY wc.code
    `,
    [req.params.id]
  );
  res.json(value.rows);
}

export const getWordOverviewWithLanguage: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT
        translate(lg.id::text, '-', '') AS "langId",
        lg.name AS "langName",
        lg.status AS "langStatus",
        w.word
      FROM words AS w
      JOIN languages AS lg
      ON w.lang_id = lg.id
      WHERE w.id = $1
    `,
    [req.params.id]
  );
  if(value.rows.length === 1) {
    res.json(value.rows[0]);
  } else {
    res.status(404).json({
      title: "Word not found", message: "The requested word was not found."
    });
  }
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
