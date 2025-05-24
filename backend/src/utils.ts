export interface IQueryError {
  code: string;
}

export function hasAllArrays(body: { [key: string]: any }, fields: string[]) {
  return fields.every(field => body[field] instanceof Array);
}

export function hasAllBooleans(body: { [key: string]: any }, fields: string[]) {
  return fields.every(field => typeof body[field] === 'boolean');
}

export function hasAllStrings(body: { [key: string]: any }, fields: string[]) {
  return fields.every(field => typeof body[field] === 'string');
}

export function isValidUUID(value: string) {
  return /^[0-9a-f]{32}$/.test(value);
}

export const partsOfSpeech = [
  ['abb', 'abbreviation'],
  ['adj', 'adjective'],
  ['adp', 'adposition'],
  ['adv', 'adverb'],
  ['aff', 'affix'],
  ['aux', 'auxiliary'],
  ['c', 'conjunction'],
  ['det', 'determiner'],
  ['i', 'interjection'],
  ['n', 'noun'],
  ['num', 'numeral'],
  ['ptc', 'particle'],
  ['phr', 'phrase'],
  ['p', 'pronoun'],
  ['ppr', 'proper noun'],
  ['v', 'verb']
].map(([code, name]) => ({ code, name }));
