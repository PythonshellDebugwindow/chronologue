import type { RequestHandler } from 'express';

import runGrammarTableRules from '../sca/runGrammarTable.js';

import query, { transact } from '../db/index.js';
import { hasAllArrays, hasAllBooleans, hasAllStrings, isValidUUID } from '../utils.js';

function validateRowsAndColumns(rows: string[], columns: string[]) {
  for(const [type, names] of [['row', rows], ['column', columns]]) {
    if(names.length === 0) {
      return `There must be at least one ${type}.`;
    }
    for(const name of names) {
      if(!name) {
        return `All ${type}s must have a name.`;
      } else if(!/^(?:\p{Lu}|\p{N})+(?:\.(?:\p{Lu}|\p{N})+)*$/u.test(name)) {
        return (
          `Invalid ${type} name '${name}': ` +
          "must be a list of grammar form codes separated by periods."
        );
      }
    }
  }
}

export const addGrammarTable: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.body.langId)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }
  if(!hasAllStrings(req.body, ['name', 'pos']) ||
     !hasAllBooleans(req.body, ['invertClasses', 'showIpa']) ||
     !hasAllArrays(req.body, ['rows', 'columns', 'classIds'])) {
    res.status(400).json({ message: "Please provide all required fields." });
    return;
  }
  const rowColumnError = validateRowsAndColumns(req.body.rows, req.body.columns);
  if(rowColumnError) {
    res.status(400).json({ message: rowColumnError });
    return;
  }

  await transact(async client => {
    const value = await client.query(
      `
        INSERT INTO grammar_tables (
          lang_id, name, pos, rows, columns, show_ipa, invert_classes, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        req.body.langId, req.body.name, req.body.pos, req.body.rows, req.body.columns,
        req.body.showIpa, req.body.invertClasses, req.body.notes
      ]
    );
    const addedTableId = value.rows[0].id.replaceAll("-", "");

    await client.query(
      `
        INSERT INTO grammar_table_classes (table_id, class_id)
        SELECT $1, unnest($2::bigint[])
      `,
      [addedTableId, req.body.classIds]
    );

    res.status(201).json(addedTableId);
  });
}

export const deleteGrammarTable: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given table ID is not valid." });
    return;
  }

  await query(
    "DELETE FROM grammar_tables WHERE id = $1",
    [req.params.id]
  );

  res.status(204).send();
}

export const editGrammarTable: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given table ID is not valid." });
    return;
  }
  if(!hasAllStrings(req.body, ['name', 'pos', 'postRules', 'notes']) ||
    !hasAllBooleans(req.body, ['invertClasses', 'showIpa']) ||
    !hasAllArrays(req.body, ['rows', 'columns', 'classIds', 'cells'])) {
    res.status(400).json({ message: "Please provide all required fields." });
    return;
  }
  const rowColumnError = validateRowsAndColumns(req.body.rows, req.body.columns);
  if(rowColumnError) {
    res.status(400).json({ message: rowColumnError });
    return;
  }

  const tableId = req.params.id;
  const cells = (req.body.cells as any[][]).flatMap((row, i) => (
    row.flatMap((cell, j) => (cell.rules || cell.stemId) ? [{
      table_id: tableId,
      row_index: i,
      column_index: j,
      rules: cell.rules,
      stem_id: cell.stemId
    }] : [])
  ));
  const cellPosRows = cells.map(cell => cell.row_index);
  const cellPosColumns = cells.map(cell => cell.column_index);

  await transact(async client => {
    await client.query(
      `
        UPDATE grammar_tables
        SET
          name = $1, pos = $2, rows = $3, columns = $4,
          show_ipa = $5, invert_classes = $6, post_rules = $7, notes = $8
        WHERE id = $9
      `,
      [
        req.body.name, req.body.pos, req.body.rows, req.body.columns,
        req.body.showIpa, req.body.invertClasses, req.body.postRules, req.body.notes,
        tableId
      ]
    );

    await client.query(
      `
        DELETE FROM grammar_table_classes
        WHERE table_id = $1 AND NOT (class_id = ANY($2::bigint[]))
      `,
      [tableId, req.body.classIds]
    );
    if(req.body.classIds.length > 0) {
      await client.query(
        `
          INSERT INTO grammar_table_classes (table_id, class_id)
          SELECT $1, unnest($2::bigint[])
          ON CONFLICT DO NOTHING
        `,
        [tableId, req.body.classIds]
      );
    }

    await client.query(
      `
        DELETE FROM grammar_table_cells
        WHERE table_id = $1 AND NOT (
          (row_index, column_index) = ANY(
            SELECT * FROM unnest($2::integer[], $3::integer[])
          )
        )
      `,
      [tableId, cellPosRows, cellPosColumns]
    );
    if(cells.length > 0) {
      await client.query(
        `
          INSERT INTO grammar_table_cells (
            table_id, row_index, column_index, rules, stem_id
          )
          SELECT c.table_id, c.row_index, c.column_index, c.rules, c.stem_id
          FROM json_populate_recordset(NULL::grammar_table_cells, $1) AS c
          ON CONFLICT (table_id, row_index, column_index) DO UPDATE
          SET
            rules = EXCLUDED.rules,
            stem_id = EXCLUDED.stem_id
        `,
        [JSON.stringify(cells)]
      );
    }
  });

  res.status(204).send();
}

export const getGrammarTable: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given table ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT
        translate(lang_id::text, '-', '') AS "langId",
        name, pos, rows, columns,
        post_rules AS "postRules",
        show_ipa AS "showIpa",
        invert_classes AS "invertClasses",
        notes
      FROM grammar_tables
      WHERE id = $1
    `,
    [req.params.id]
  );
  if(value.rows.length === 1) {
    value.rows[0].id = req.params.id;
    res.json(value.rows[0]);
  } else {
    res.status(404).json({ title: "Table not found", message: "The requested table was not found." });
  }
}

export const getGrammarTableClasses: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given table ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT wc.id, wc.code, wc.name
      FROM grammar_table_classes AS gtc
      INNER JOIN word_classes AS wc
      ON gtc.class_id = wc.id
      WHERE gtc.table_id = $1
      ORDER BY wc.code
    `,
    [req.params.id]
  );
  res.json(value.rows);
}

export const getGrammarTableClassIds: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given table ID is not valid." });
    return;
  }

  const value = await query({
    text: `
      SELECT wc.id
      FROM grammar_table_classes AS gtc
      INNER JOIN word_classes AS wc
      ON gtc.class_id = wc.id
      WHERE gtc.table_id = $1
      ORDER BY wc.code
    `,
    values: [req.params.id],
    rowMode: 'array'
  });
  res.json(value.rows.flat());
}

export const getGrammarTableFilledCells: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given table ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT
        row_index AS "row", column_index AS "column", rules, stem_id AS "stemId"
      FROM grammar_table_cells
      WHERE table_id = $1
    `,
    [req.params.id]
  );
  res.json(value.rows);
}

export const getGrammarTablesForWord: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given word ID is not valid." });
    return;
  }

  await transact(async client => {
    const wordResult = await client.query(
      `
        SELECT pos, lang_id
        FROM words
        WHERE id = $1
      `,
      [req.params.id]
    );
    if(wordResult.rows.length !== 1) {
      res.status(400).json({ message: "The given word does not exist." });
      return;
    }
    const wordData = wordResult.rows[0];

    const tablesResult = await query(
      `
        SELECT translate(gt.id::text, '-', '') AS id, gt.name
        FROM grammar_table_classes AS gtc
        RIGHT JOIN grammar_tables AS gt
        ON gtc.table_id = gt.id
        WHERE gt.lang_id = $1 AND gt.pos = $2
        GROUP BY gt.id
        HAVING
          CASE WHEN gt.invert_classes THEN NOT ((
            SELECT coalesce(array_agg(class_id) FILTER (WHERE class_id IS NOT NULL), '{}')
            FROM word_classes_by_word
            WHERE word_id = $3
          ) && coalesce(
            array_agg(gtc.class_id) FILTER (WHERE gtc.class_id IS NOT NULL), '{}'
          ))
          ELSE (
            SELECT coalesce(array_agg(class_id) FILTER (WHERE class_id IS NOT NULL), '{}')
            FROM word_classes_by_word
            WHERE word_id = $3
          ) @> coalesce(
            array_agg(gtc.class_id) FILTER (WHERE gtc.class_id IS NOT NULL), '{}'
          )
          END
        ORDER BY gt.name
      `,
      [wordData.lang_id, wordData.pos, req.params.id]
    );
    res.json(tablesResult.rows);
  });
}

export const getLanguageGrammarTables: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given language ID is not valid." });
    return;
  }

  const value = await query(
    `
      SELECT
        translate(id::text, '-', '') AS id,
        name, pos, rows, columns
      FROM grammar_tables
      WHERE lang_id = $1
    `,
    [req.params.id]
  );
  res.json(value.rows);
}

export const getRandomWordForGrammarTable: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given table ID is not valid." });
    return;
  }

  await transact(async client => {
    const tableResult = await client.query(
      `
        SELECT lang_id, pos, invert_classes
        FROM grammar_tables
        WHERE id = $1
      `,
      [req.params.id]
    );
    if(tableResult.rows.length !== 1) {
      res.status(400).json({ message: "The given table does not exist." });
      return;
    }
    const tableData = tableResult.rows[0];

    const wordResult = await client.query(
      `
        SELECT * FROM (
          SELECT translate(w.id::text, '-', '') AS id, w.word, w.meaning
          FROM word_classes_by_word AS wc
          RIGHT JOIN words AS w
          ON wc.word_id = w.id
          WHERE w.pos = $1 AND w.lang_id = $2
          GROUP BY w.id
          HAVING
            CASE WHEN $3 THEN NOT (array_agg(wc.class_id) && (
              SELECT ARRAY(
                SELECT class_id
                FROM grammar_table_classes
                WHERE table_id = $4
              )
            ))
            ELSE array_agg(wc.class_id) @> (
              SELECT ARRAY(
                SELECT class_id
                FROM grammar_table_classes
                WHERE table_id = $4
              )
            )
            END
        )
        ORDER BY RANDOM()
        LIMIT 1
      `,
      [tableData.pos, tableData.lang_id, tableData.invert_classes, req.params.id]
    );
    if(wordResult.rows.length === 0) {
      res.json(null);
      return;
    }

    const word = wordResult.rows[0];
    const runResult = await runGrammarTableRules(req.params.id, word, client);
    if(runResult.success) {
      res.json({ ...wordResult.rows[0], cells: runResult.result });
    } else {
      res.status(400).json({ message: runResult.message });
    }
  });
}

export const runGrammarTableOnWord: RequestHandler = async (req, res) => {
  if(!isValidUUID(req.params.id)) {
    res.status(400).json({ title: "Invalid ID", message: "The given table ID is not valid." });
    return;
  }
  if(!hasAllStrings(req.body, ['wordId'])) {
    res.status(400).json({ message: "Invalid request body." });
    return;
  }

  await transact(async client => {
    const wordResult = await client.query(
      "SELECT id, word FROM words WHERE id = $1",
      [req.body.wordId]
    );
    if(wordResult.rows.length === 0) {
      res.status(400).json({ message: "The requested word was not found." });
      return;
    }

    const word = wordResult.rows[0];
    const result = await runGrammarTableRules(req.params.id, word, client);
    if(result.success) {
      res.json(result.result);
    } else {
      res.status(400).json({ message: result.message });
    }
  });
}
