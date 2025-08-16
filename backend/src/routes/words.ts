import type { RequestHandler } from 'express';

import { getWordDerivationIntoLanguage } from '../sca/getWordDerivation.js';

import query, { transact } from '../db/index.js';
import { updateWordDerivationsTable } from '../utils/words.js';
import { hasAllStrings, isValidUUID, partsOfSpeech } from '../utils.js';

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

    if(req.body.etymology) {
      await updateWordDerivationsTable(addedId, req.body.etymology, true, client);
    }

    res.status(201).json(addedId);
  });
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

    await updateWordDerivationsTable(wordId, req.body.etymology, false, client);
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

    const derived = await getWordDerivationIntoLanguage(word, req.params.langId, client);
    res.json({ derived });
  });
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

export const getWordDescendants: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }

  const value = await query(
    `
      WITH RECURSIVE descendants AS (
          SELECT w.id, w.word, w.lang_id, $1::text AS parent_id, wd.is_borrowing
          FROM words w
          INNER JOIN word_derivations wd
          ON wd.child_id = w.id AND wd.parent_id = $1::text::uuid
        UNION
          SELECT
            d.id, d.word, d.lang_id,
            translate(a.id::text, '-', '') AS parent_id,
            wd.is_borrowing
          FROM words d
          INNER JOIN word_derivations wd ON wd.child_id = d.id
          INNER JOIN descendants a ON wd.parent_id = a.id
      )
      SELECT
        translate(d.id::text, '-', '') AS id,
        d.word,
        translate(d.lang_id::text, '-', '') AS "langId",
        lg.name AS "langName",
        lg.status AS "langStatus",
        d.parent_id AS "parentId",
        d.is_borrowing AS "isBorrowed"
      FROM descendants d
      JOIN languages lg ON d.lang_id = lg.id
      ORDER BY d.is_borrowing, lg.name, d.word
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
