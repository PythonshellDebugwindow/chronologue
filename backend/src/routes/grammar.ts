import type { RequestHandler } from 'express';

import query, { transact } from '../db/index.js';
import { IQueryError } from '../utils.js';

export const getGrammarForms: RequestHandler = async (req, res) => {
  const value = await query(
    "SELECT id, code, name FROM grammar_forms"
  );
  res.json(value.rows);
};

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
        res.status(400).json({ message: "All grammar forms must have a name."});
        return;
      } else if(!/^(\p{Lu}|\p{N})+$/u.test(cls.code)) {
        res.status(400).json({ message: "All codes must be alphanumeric with no lowercase letters." });
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
          SET code = EXCLUDED.code,
              name = EXCLUDED.name
        `,
        [ JSON.stringify(req.body.new) ]
      );
      await client.query(
        "DELETE FROM grammar_forms WHERE id = ANY($1::bigint[])",
        [ req.body.deleted ]
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
};
