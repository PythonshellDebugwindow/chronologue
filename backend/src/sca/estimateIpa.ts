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
    letterReplacements: pe.letterReplacements.split("\n").flatMap(
      r => r.includes("|") ? [r.split("|", 2)] : []
    ).sort((r1, r2) => r2[0].length - r1[0].length),
    rewriteRules: pe.rewriteRules
  };
}

export async function makeEstimatePronunciation(langId: string) {
  const result = await transact(async client => {
    const phonesQuery = await client.query(
      `
        SELECT base, qualities, graph
        FROM phones
        WHERE lang_id = $1
        ORDER BY length(graph) DESC
      `,
      [langId]
    );
    const phones = phonesQuery.rows as IPartialPhone[];
    phones.sort((p1, p2) => p2.graph.length - p1.graph.length);

    const peQuery = await client.query(
      `
        SELECT
          letter_replacements AS "letterReplacements",
          rewrite_rules AS "rewriteRules"
        FROM pronunciation_estimation
        WHERE lang_id = $1
      `,
      [langId]
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
      [langId]
    );
    const categories = categoriesQuery.rows;

    const orthSettingsQuery = await client.query(
      `
        SELECT case_sensitive
        FROM orthography_settings
        WHERE lang_id = $1
      `,
      [langId]
    );
    const caseSensitive = orthSettingsQuery.rows[0].case_sensitive;

    function foldCase(word: string) {
      return caseSensitive ? word : word.toLowerCase();
    }

    const sca = new SCA(categories);
    const setRulesResult = sca.setRules(rewriteRules);
    if(!setRulesResult.success) {
      return setRulesResult;
    }

    const estimate = (word: string) => {
      let estimation = "";
      for(let i = 0; i < word.length; ) {
        if(/\s/.test(word[i])) {
          if(!estimation.endsWith(" ")) {
            estimation += " ";
          }
          if(i > 0 && ".!?".includes(word[i - 1])) {
            estimation += "| ";
          }
          ++i;
          continue;
        }
        const foldedWord = foldCase(word);
        const replacement = letterReplacements.find(lr => (
          foldCase(lr[0]) === foldedWord.substring(i, i + lr[0].length)
        ));
        if(replacement) {
          estimation += replacement[1];
          i += replacement[0].length;
          continue;
        }
        const phone = phones.find(p => (
          p.graph && foldedWord.substring(i, i + p.graph.length) === p.graph
        ));
        if(phone) {
          const phoneString = phoneToString(phone);
          estimation += phoneString;
          i += phone.graph.length;
        } else {
          estimation += /\p{P}|\p{S}/u.test(word[i]) ? "" : "*";
          ++i;
        }
      }
      return sca.applySoundChanges(estimation);
    };
    return { success: true as const, estimate };
  });
  return result!;
}
