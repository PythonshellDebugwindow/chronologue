import type { PoolClient } from 'pg';

export async function updateWordDerivationsTable(
  wordId: string, etymology: string, isNewWord: boolean, client: PoolClient
) {
  const parentIdRegex = /(?:[^@]|^)(?:@@)*@([BbDd])\(([0-9a-f]{32})\)/g;
  const parentIdMatches = [...etymology.matchAll(parentIdRegex)];
  const derivations = parentIdMatches.flatMap(match => {
    // Ensure that all IDs are unique
    if(parentIdMatches.find(pm => pm[2] === match[2]) !== match) {
      return [];
    }
    return [{
      child_id: wordId,
      parent_id: match[2],
      is_borrowing: match[1] === 'B' || match[1] === 'b'
    }];
  });
  const parentIds = derivations.map(derivation => derivation.parent_id);

  if(!isNewWord) {
    await client.query(
      `
        DELETE FROM word_derivations
        WHERE child_id = $1 AND NOT (parent_id = ANY($2::uuid[]))
      `,
      [wordId, parentIds]
    );
  }
  if(derivations.length > 0) {
    await client.query(
      `
        INSERT INTO word_derivations (child_id, parent_id, is_borrowing)
        SELECT wd.child_id, wd.parent_id, wd.is_borrowing
        FROM json_populate_recordset(NULL::word_derivations, $1) AS wd
        WHERE EXISTS (SELECT 1 FROM words WHERE id = wd.parent_id)
        ON CONFLICT (child_id, parent_id) DO UPDATE
        SET is_borrowing = EXCLUDED.is_borrowing
      `,
      [JSON.stringify(derivations)]
    );
  }
}
