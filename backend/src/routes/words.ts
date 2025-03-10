import type { RequestHandler } from 'express';

import query, { transact } from '../db/index.js';
import { partsOfSpeech, hasAllFields, IQueryError } from '../utils.js';

export const addWord: RequestHandler = async (req, res) => {
  if(!req.body.word || !req.body.meaning || !req.body.pos || !req.body.langId ||
      !hasAllFields(req.body, [ 'ipa', 'etymology', 'notes' ]) ||
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
      [ req.body.word, req.body.ipa, req.body.meaning, req.body.pos,
        req.body.etymology, req.body.notes, req.body.langId ]
    );
    const addedId = value.rows[0].id.replaceAll("-", "");

    if(req.body.classIds.length > 0) {
      await client.query(
        `
          INSERT INTO word_classes_by_word (word_id, class_id)
          SELECT $1, unnest($2::bigint[])
        `,
        [ addedId, req.body.classIds ]
      );
    }

    res.status(201).json(addedId);
  });
};

export const deleteWord: RequestHandler = async (req, res) => {
  if(!/^[0-9a-f]{32}$/.test(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }

  await query(
    "DELETE FROM words WHERE id = $1",
    [ req.params.id ]
  );
  res.status(204).send();
};

export const editWord: RequestHandler = async (req, res) => {
  if(!/^[0-9a-f]{32}$/.test(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }
  if(!req.body.word || !req.body.meaning || !req.body.pos ||
      !hasAllFields(req.body, [ 'ipa', 'etymology', 'notes' ]) ||
      !(req.body.classIds instanceof Array)) {
    res.status(400).json({ message: "Please provide all required fields." });
    return;
  }
  
  await transact(async client => {
    if(!partsOfSpeech.some(pos => req.body.pos === pos.code)) {
      res.status(400).json({ message: "Please provide a valid part of speech." });
      return;
    }

    const wordId = req.params.id;
    
    await client.query(
      `
        UPDATE words
        SET word = $1, ipa = $2, meaning = $3, pos = $4, etymology = $5, notes = $6,
            updated = CURRENT_TIMESTAMP
        WHERE id = $7
      `,
      [ req.body.word, req.body.ipa, req.body.meaning, req.body.pos,
        req.body.etymology, req.body.notes, wordId ]
    );

    await client.query(
      `
        DELETE FROM word_classes_by_word
        WHERE word_id = $1 AND NOT (class_id = ANY($2::bigint[]))
      `,
      [ wordId, req.body.classIds ]
    );
    if(req.body.classIds.length > 0) {
      await client.query(
        `
          INSERT INTO word_classes_by_word (word_id, class_id)
          SELECT $1, unnest($2::bigint[])
          ON CONFLICT DO NOTHING
        `,
        [ wordId, req.body.classIds ]
      );
    }
  });

  res.status(204).send();
};

export const getLanguageWords: RequestHandler = async (req, res) => {
  if(!/^[0-9a-f]{32}$/.test(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  
  const value = await query(
    `
      SELECT translate(id::text, '-', '') AS id,
             word, ipa, meaning, pos, etymology, notes, created, updated
      FROM words
      WHERE lang_id = $1
    `,
    [ req.params.id ]
  );
  res.json(value.rows);
};

export const getPartsOfSpeech: RequestHandler = async (req, res) => {
  res.json(partsOfSpeech);
};

export const getWord: RequestHandler = async (req, res, next) => {
  if(!/^[0-9a-f]{32}$/.test(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }
  
  const value = await query(
    `
      SELECT word, ipa, meaning, pos, etymology, notes,
             translate(lang_id::text, '-', '') AS "langId",
             created, updated
      FROM words
      WHERE id = $1
    `,
    [ req.params.id ]
  );
  if(value.rows.length === 1) {
    value.rows[0].id = req.params.id;
    res.json(value.rows[0]);
  } else {
    res.status(404).json({ title: "Word not found", message: "The requested word was not found." });
  }
};

export const getWordClassesByLanguage: RequestHandler = async (req, res) => {
  if(!/^[0-9a-f]{32}$/.test(req.params.id)) {
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
    [ req.params.id ]
  );
  res.json(value.rows);
};

export const getWordClassIdsByWord: RequestHandler = async (req, res) => {
  if(!/^[0-9a-f]{32}$/.test(req.params.id)) {
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
    values: [ req.params.id ],
    rowMode: 'array'
  });
  res.json(value.rows.flat());
};

export const getWordClassesByWord: RequestHandler = async (req, res) => {
  if(!/^[0-9a-f]{32}$/.test(req.params.id)) {
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
    [ req.params.id ]
  );
  res.json(value.rows);
};

export const updateWordClasses: RequestHandler = async (req, res, next) => {
  try {
    if(!/^[0-9a-f]{32}$/.test(req.params.id)) {
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
        res.status(400).json({ message: "All classes must have a name."});
        return;
      } else if(cls.code.length > 5) {
        res.status(400).json({
          message: `Invalid code '${cls.code}': must be at most 5 characters long.`
        });
        return;
      } else if(!/^(\p{L}\p{M}?|\p{N})+$/u.test(cls.code)) {
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
    
    await transact(async client => {
      const langId = req.params.id;
      const toAdd = req.body.new.map((cls: any) => ({
        id: cls.id,
        lang_id: langId,
        pos: cls.pos,
        code: cls.code,
        name: cls.name
      }));
      
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
          SET code = EXCLUDED.code,
              name = EXCLUDED.name
        `,
        [ langId, JSON.stringify(toAdd) ]
      );
      await client.query(
        "DELETE FROM word_classes WHERE id = ANY($1::bigint[])",
        [ req.body.deleted ]
      );
      
      const langWordClasses = await client.query(
        `
          SELECT id, pos, code, name
          FROM word_classes
          WHERE lang_id = $1
          ORDER BY pos, code
        `,
        [ langId ]
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
};
