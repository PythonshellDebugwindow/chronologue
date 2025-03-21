import type { PoolClient } from 'pg';

import { SCA } from './sca.js';

export default async function runGrammarTableRules(
  tableId: string, word: string, client: PoolClient
) {
  const tableDataResult = await client.query(
    `
      SELECT lang_id as "langId",
             cardinality(rows) as "numRows",
             cardinality(columns) as "numColumns"
      FROM grammar_tables
      WHERE id = $1
    `,
    [ tableId ]
  );
  if(tableDataResult.rows.length !== 1) {
    return { success: false as false, message: "The requested table was not found." };
  }
  const tableData = tableDataResult.rows[0];

  const filledCellsResult = await client.query(
    `
      SELECT row_index AS "row",
             column_index AS "column",
             rules AS "rules"
      FROM grammar_table_cells
      WHERE table_id = $1
    `,
    [ tableId ]
  );

  const categoriesResult = await client.query(
    `
      SELECT letter, string_to_array(members, ',') AS members
      FROM orthography_categories
      WHERE lang_id = $1
    `,
    [ tableData.langId ]
  );

  const tableSCA = new SCA(categoriesResult.rows);

  const result = [];
  for(let row = 0; row < tableData.numRows; ++row) {
    result.push(Array(tableData.numColumns).fill(null));
  }
  for(const cell of filledCellsResult.rows) {
    const setRulesResult = tableSCA.setRules(cell.rules);
    if(setRulesResult.success) {
      result[cell.row][cell.column] = tableSCA.applySoundChanges(word);
    } else {
      result[cell.row][cell.column] = setRulesResult;
    }
  }

  return { success: true as true, result };
};
