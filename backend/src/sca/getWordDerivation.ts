import pg from 'pg';
const { escapeIdentifier } = pg;

import type { PoolClient } from 'pg';

import { SCA } from './sca.js';

interface IPartialWord {
  word: string;
  ipa: string;
  langId: string;
}

export async function getWordDerivationIntoLanguage(
  word: IPartialWord, destLangId: string, client: PoolClient
) {
  const rulesetQuery = await client.query(
    `
      SELECT rules, from_ipa AS "fromIpa"
      FROM language_derivation_rules
      WHERE dest_lang_id = $1 AND src_lang_id = $2
    `,
    [destLangId, word.langId]
  );
  if(rulesetQuery.rows.length !== 1) {
    return null;
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
    return setRulesResult;
  }
  const scaResult = sca.applySoundChanges(ruleset.fromIpa ? word.ipa : word.word);
  return scaResult;
}
