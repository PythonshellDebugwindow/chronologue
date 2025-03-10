import { transact } from '../db/index.js';

import { phoneToString } from '../../../shared/dist/phones.js';
import { SCA } from './sca.js';

interface IPartialPhone {
  base: string;
  qualities: string[];
  graph: string;
}

interface IPronunciationEstimation {
  letterReplacements: string;
  rewriteRules: string;
}

function splitLetterReplacements(pe: IPronunciationEstimation) {
  return {
    letterReplacements: pe.letterReplacements.split("\n").map(
      r => r.split("|", 2)
    ).sort((r1, r2) => r2[0].length - r1[0].length),
    rewriteRules: pe.rewriteRules
  };
}

export async function estimatePronunciations(langId: string, words: string[]) {
  const result: string[] = [];
  let errorMessage: string | null = null;

  await transact(async client => {
    const phonesQuery = await client.query(
      `
        SELECT base, qualities, graph
        FROM phones
        WHERE lang_id = $1
        ORDER BY length(graph) DESC
      `,
      [ langId ]
    );
    const phones = phonesQuery.rows as IPartialPhone[];

    const peQuery = await client.query(
      `
        SELECT letter_replacements AS "letterReplacements", rewrite_rules AS "rewriteRules"
        FROM pronunciation_estimation
        WHERE lang_id = $1
      `,
      [ langId ]
    );
    const { letterReplacements, rewriteRules } = (
      peQuery.rows.length === 1
      ? splitLetterReplacements(peQuery.rows[0] as IPronunciationEstimation)
      : { letterReplacements: [], rewriteRules: "" }
    );

    const categoriesQuery = await client.query(
      `
        SELECT letter, string_to_array(members, ',') AS members
        FROM phonology_categories
        WHERE lang_id = $1
      `,
      [ langId ]
    );
    const categories = categoriesQuery.rows;

    const sca = new SCA(categories);
    const setRulesResult = sca.setRules(rewriteRules);
    if(!setRulesResult.success) {
      errorMessage = setRulesResult.message;
      return;
    }

    for(const word of words) {
      let estimation = "";
      for(let i = 0; i < word.length; ) {
        if(word[i] === " ") {
          estimation += " ";
          ++i;
          continue;
        }
        const replacement = letterReplacements.find(
          lr => lr[0] === word.substring(i, i + lr[0].length)
        );
        if(replacement) {
          estimation += replacement[1];
          i += replacement[0].length;
          continue;
        }
        const phone = phones.find(
          p => p.graph && word.substring(i, i + p.graph.length) === p.graph
        );
        if(phone) {
          const phoneString = phoneToString(phone);
          estimation += phoneString;
          i += phoneString.length;
        } else {
          estimation += "*";
          ++i;
        }
      }
      const rewriteResult = sca.applySoundChanges(estimation);
      if(!rewriteResult.success) {
        errorMessage = rewriteResult.message;
        return;
      }
      result.push(rewriteResult.result);
    }
  });

  if(errorMessage) {
    return { success: false as false, message: errorMessage };
  } else {
    return { success: true as true, result };
  }
};
