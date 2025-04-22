import type { PoolClient } from 'pg';

import { makeEstimatePronunciation } from './estimateIpa.js';
import { SCA } from './sca.js';

export default async function runGrammarTableRules(
  tableId: string, word: string, client: PoolClient
) {
  const tableDataResult = await client.query(
    `
      SELECT lang_id AS "langId",
             cardinality(rows) AS "numRows",
             cardinality(columns) AS "numColumns",
             show_ipa AS "showIpa"
      FROM grammar_tables
      WHERE id = $1
    `,
    [tableId]
  );
  if(tableDataResult.rows.length !== 1) {
    return { success: false as const, message: "The requested table was not found." };
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
    [tableId]
  );

  const categoriesResult = await client.query(
    `
      SELECT letter, string_to_array(members, ',') AS members
      FROM orthography_categories
      WHERE lang_id = $1
    `,
    [tableData.langId]
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

  if(tableData.showIpa) {
    const makeEstimateResult = await makeEstimatePronunciation(tableData.langId);
    if(makeEstimateResult.success) {
      for(const position of filledCellsResult.rows) {
        const cell = result[position.row][position.column];
        if(cell.success) {
          const estimateResult = makeEstimateResult.estimate(cell.result);
          if(estimateResult.success) {
            cell.ipa = estimateResult.result;
          }
        }
      }
    }
  }

  return { success: true as const, result };
};
