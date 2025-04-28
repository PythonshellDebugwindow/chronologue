import type { PoolClient } from 'pg';

import { makeEstimatePronunciation } from './estimateIpa.js';
import { SCA } from './sca.js';

interface IWordWithId {
  id: string;
  word: string;
}

export default async function runGrammarTableRules(
  tableId: string, word: IWordWithId, client: PoolClient
) {
  const tableDataResult = await client.query(
    `
      SELECT
        lang_id AS "langId",
        pos,
        cardinality(rows) AS "numRows",
        cardinality(columns) AS "numColumns",
        post_rules AS "postRules",
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
      SELECT
        row_index AS "row",
        column_index AS "column",
        rules,
        stem_id AS "stemId"
      FROM grammar_table_cells
      WHERE table_id = $1
    `,
    [tableId]
  );

  const irregularFormsResult = await client.query(
    `
      SELECT
        row_index AS "row",
        column_index AS "column",
        form
      FROM grammar_table_irregular_forms
      WHERE table_id = $1 AND word_id = $2
    `,
    [tableId, word.id]
  );

  const langStemsResult = await client.query({
    text: `
      SELECT id, rules
      FROM word_stems
      WHERE lang_id = $1 AND pos = $2
    `,
    values: [tableData.langId, tableData.pos],
    rowMode: 'array'
  });
  const langStemRules = new Map(langStemsResult.rows as [string, string][]);

  const categoriesResult = await client.query(
    `
      SELECT letter, string_to_array(members, ',') AS members
      FROM orthography_categories
      WHERE lang_id = $1
    `,
    [tableData.langId]
  );

  const tableSCA = new SCA(categoriesResult.rows);

  const postRulesSCA = tableData.postRules ? new SCA(categoriesResult.rows) : null;
  if(postRulesSCA) {
    const setPostRulesResult = postRulesSCA.setRules(tableData.postRules);
    if(!setPostRulesResult.success) {
      return {
        success: false as const,
        message: "Error in post rules: " + setPostRulesResult.message
      };
    }
  }

  const result = [];
  for(let row = 0; row < tableData.numRows; ++row) {
    result.push(Array(tableData.numColumns).fill(null));
  }

  for(const cell of irregularFormsResult.rows) {
    result[cell.row][cell.column] = { success: true, result: cell.form };
  }

  for(const cell of filledCellsResult.rows) {
    if(result[cell.row][cell.column]) {
      continue;
    }

    if(cell.stemId) {
      const stemRules = langStemRules.get(cell.stemId);
      if(stemRules === undefined) {
        result[cell.row][cell.column] = {
          success: false as const, message: "Invalid stem ID"
        };
        continue;
      }
      
      const setRulesResult = tableSCA.setRules(stemRules);
      if(!setRulesResult.success) {
        result[cell.row][cell.column] = setRulesResult;
        continue;
      }

      const scaResult = tableSCA.applySoundChanges(word.word);
      result[cell.row][cell.column] = scaResult;
      if(!scaResult.success) {
        continue;
      }
    }
    
    const setRulesResult = tableSCA.setRules(cell.rules);
    if(!setRulesResult.success) {
      result[cell.row][cell.column] = setRulesResult;
      continue;
    }

    const base = cell.stemId ? result[cell.row][cell.column].result : word.word;
    const scaResult = tableSCA.applySoundChanges(base);
    if(postRulesSCA && scaResult.success) {
      result[cell.row][cell.column] = postRulesSCA.applySoundChanges(scaResult.result);
    } else {
      result[cell.row][cell.column] = scaResult;
    }
  }

  if(tableData.showIpa) {
    const makeEstimateResult = await makeEstimatePronunciation(tableData.langId);
    if(makeEstimateResult.success) {
      for(const row of result) {
        for(const cell of row) {
          if(cell?.success) {
            const estimateResult = makeEstimateResult.estimate(cell.result);
            if(estimateResult.success) {
              cell.ipa = estimateResult.result;
            }
          }
        }
      }
    }
  }

  return { success: true as const, result };
};
