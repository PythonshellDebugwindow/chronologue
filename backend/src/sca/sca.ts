import { readFileSync } from 'fs';

interface ICategory {
  letter: string;
  members: string[];
}

type RuleTokenType = 'comma' | 'hashtag' | 'pipe' | 'underscore' | 'category' | 'literal';

interface IRuleToken {
  type: RuleTokenType;
  char: string;
}

type TokeniseRuleResult = {
  success: true;
  segments: IRuleToken[][];
} | {
  success: false;
  message: string;
};

function failure(message: string) {
  return { success: false as const, message };
}

function parseRule(rule: string): TokeniseRuleResult {
  const segments: IRuleToken[][] = [];
  let tokens: IRuleToken[] = [];
  const isInEnvOrExp = () => segments.length === 2 || segments.length === 3;

  for(let i = 0; i < rule.length; ++i) {
    const char = rule[i];
    if(char === "/") {
      if(segments.length === 4) {
        return failure("Too many segments");
      } else if(tokens.length > 0) {
        if(isComma(tokens[tokens.length - 1])) {
          return failure("Empty temporary category member");
        } else if(isPipe(tokens[tokens.length - 1])) {
          return failure("Empty condition");
        }
      }
      if(tokens.some(isComma)) {
        if(!tokens.every(t => isComma(t) || isLiteral(t))) {
          return failure("Invalid temporary category");
        }
        segments.push(combineTemporaryCategoryLiteralMemberTokens(tokens));
      } else {
        segments.push(tokens);
      }
      tokens = [];
    } else if(char === "!") {
      if(i + 1 >= rule.length) {
        return failure("Unfinished escape sequence");
      }
      ++i;
      tokens.push({ type: 'literal', char: rule[i] });
    } else if(char === ",") {
      if(isInEnvOrExp()) {
        return failure("Comma inside ENV or EXP");
      } else if(tokens.length === 0 || isComma(tokens[tokens.length - 1])) {
        return failure("Empty temporary category member");
      }
      tokens.push({ type: 'comma', char });
    } else if(char === "#") {
      tokens.push({ type: 'hashtag', char });
    } else if(char === "|") {
      if(!isInEnvOrExp()) {
        return failure("Pipe outside of ENV or EXP");
      } else if(tokens.length === 0 || isPipe(tokens[tokens.length - 1])) {
        return failure("Empty condition");
      }
      tokens.push({ type: 'pipe', char });
    } else if(char === "_") {
      if(!isInEnvOrExp()) {
        return failure("Underscore outside of ENV or EXP");
      }
      const lastUnderscoreIndex = findLastIndex(tokens, isUnderscore);
      if(lastUnderscoreIndex !== -1) {
        const lastPipeIndex = findLastIndex(tokens, isPipe);
        if(lastPipeIndex < lastUnderscoreIndex) {
          return failure("Multiple underscores in a single condition");
        }
      }
      tokens.push({ type: 'underscore', char });
    } else if(/\p{Lu}/u.test(char)) {
      tokens.push({ type: 'category', char });
    } else {
      tokens.push({ type: 'literal', char });
    }
  }

  if(tokens.length > 0 && isPipe(tokens[tokens.length - 1])) {
    return failure("Empty condition");
  } else if(tokens.length === 0 && isInEnvOrExp()) {
    return failure("Empty condition");
  }
  if(tokens.some(isComma)) {
    if(!tokens.every(t => isComma(t) || isLiteral(t))) {
      return failure("Invalid temporary category");
    } else if(isComma(tokens[tokens.length - 1])) {
      return failure("Empty temporary category member");
    }
    segments.push(combineTemporaryCategoryLiteralMemberTokens(tokens));
  } else {
    segments.push(tokens);
  }
  return { success: true, segments };
}

function combineTemporaryCategoryLiteralMemberTokens(tokens: IRuleToken[]) {
  const split = splitTokens(tokens, 'comma');
  return split.flatMap(tt => [
    { type: 'comma', char: "," },
    { type: 'literal', char: tokensToString(tt) }
  ] as IRuleToken[]).slice(1);
}

function findLastIndex<T>(array: T[], predicate: (value: T) => boolean) {
  for(let i = array.length - 1; i >= 0; --i) {
    if(predicate(array[i])) {
      return i;
    }
  }
  return -1;
}

function isComma(token: IRuleToken) {
  return token.type === 'comma';
}
function isHashtag(token: IRuleToken) {
  return token.type === 'hashtag';
}
function isPipe(token: IRuleToken) {
  return token.type === 'pipe';
}
function isUnderscore(token: IRuleToken) {
  return token.type === 'underscore';
}
function isCategory(token: IRuleToken) {
  return token.type === 'category';
}
function isLiteral(token: IRuleToken) {
  return token.type === 'literal';
}

function tokensToString(tokens: IRuleToken[]) {
  return tokens.map(t => t.char).join("");
}

function splitTokens(tokens: IRuleToken[], type: RuleTokenType) {
  const result: IRuleToken[][] = [];
  let current: IRuleToken[] = [];
  for(const token of tokens) {
    if(token.type === type) {
      result.push(current);
      current = [];
    } else {
      current.push(token);
    }
  }
  result.push(current);
  return result;
}

export class SCA {
  #categories: Map<string, string[]>;
  #hasRules: boolean;
  #result: string;
  #rules: (IRuleToken[][] | null)[];

  constructor(categories: ICategory[]) {
    this.#categories = new Map();
    for(const category of categories) {
      this.#categories.set(category.letter, category.members);
    }
    this.#hasRules = false;
    this.#result = "";
    this.#rules = [];
  }

  setRules(rulesString: string) {
    const ruleStrings = rulesString.split("\n");
    this.#rules.length = 0;
    for(const [i, ruleString] of ruleStrings.entries()) {
      if(!ruleString.includes("/")) {
        // Comment line (no slashes)
        this.#rules.push(null);
        continue;
      }
      const parseResult = parseRule(ruleString);
      if(!parseResult.success) {
        return failure(`${parseResult.message} on line ${i + 1}`);
      }
      if(parseResult.segments.length < 2) {
        // Comment line (no unescaped slashes)
        this.#rules.push(null);
        continue;
      }
      this.#rules.push(parseResult.segments);
    }
    this.#hasRules = true;
    return { success: true as const };
  }

  applySoundChanges(initialWord: string) {
    if(!this.#hasRules) {
      return failure("No rules were provided (internal error)");
    }

    this.#result = initialWord;

    for(const [i, rule] of this.#rules.entries()) {
      if(!rule) {
        continue;
      }
      try {
        const ruleResult = this.#applyOneSoundChangeRule(rule);
        if(ruleResult) {
          return failure(`${ruleResult.message} on line ${i + 1}`)
        }
      } catch(err) {
        return failure(`${(err as Error).message} on line ${i + 1}`);
      }
    }
    return { success: true as const, result: this.#result };
  }

  #applyOneSoundChangeRule(rule: (IRuleToken[] | undefined)[]) {
    const [target, change, env, exp, elseChange] = rule;
    if(!target || !change) {
      return failure("Internal error (no target or change)");
    }

    if(target.some(isHashtag)) {
      // Affix or global replacement
      if(target.findIndex(isHashtag) !== findLastIndex(target, isHashtag)) {
        return failure("Invalid target");
      } else if(target.some(isCategory)) {
        return failure("Invalid target");
      } else if(change.some(isCategory)) {
        return failure("Invalid change");
      } else if(elseChange?.some(isCategory)) {
        return failure("Invalid else");
      }

      const matches = this.#resultMatchesGlobalEnvOrExp(env, exp);
      if(!matches) {
        return;
      } else if(matches === 'exp' && !elseChange) {
        return;
      }
      const theChange = matches === 'env' ? change : elseChange!;
      if(theChange.some(isHashtag)) {
        // Affix
        if(target.length !== 1) {
          return failure("Invalid target");
        }
        const hashtagIndex = theChange.findIndex(isHashtag);
        if(hashtagIndex !== findLastIndex(theChange, isHashtag)) {
          return failure(matches === 'env' ? "Invalid change" : "Invalid else");
        }
        const prefix = theChange.slice(0, hashtagIndex);
        const suffix = theChange.slice(hashtagIndex + 1);
        this.#result = tokensToString(prefix) + this.#result + tokensToString(suffix);
      } else {
        // Global replacement
        const hashtagIndex = target.findIndex(isHashtag);
        const condSuffix = tokensToString(target.slice(0, hashtagIndex));
        const condPrefix = tokensToString(target.slice(hashtagIndex + 1));
        if(condPrefix && condSuffix) {
          return failure("Invalid target");
        } else if(condPrefix) {
          if(this.#result.startsWith(condPrefix)) {
            const after = this.#result.substring(condPrefix.length);
            this.#result = tokensToString(theChange) + after;
          }
        } else if(condSuffix) {
          if(this.#result.endsWith(condSuffix)) {
            const before = this.#result.substring(0, this.#result.length - condSuffix.length);
            this.#result = before + tokensToString(theChange);
          }
        } else {
          this.#result = tokensToString(theChange);
        }
      }
    } else if(this.#isCategory(target)) {
      // Category replacement
      const targetMembers = this.#getCategoryMembers(target);

      if(this.#isCategory(change)) {
        // With a category
        if(elseChange && !this.#isCategory(elseChange)) {
          return failure("Change and else are not of the same form");
        }
        const changeMembers = this.#getCategoryMembers(change);
        const elseChangeMembers = elseChange && this.#getCategoryMembers(elseChange);
        let replaced = this.#result;
        for(let i = 0; i < this.#result.length; ++i) {
          const index = targetMembers.indexOf(this.#result[i]);
          if(index >= 0) {
            const matches = this.#resultMatchesLocalEnvOrExpAt(env, exp, i, 1);
            if(matches && !(matches === 'exp' && !elseChange)) {
              const matchChangeMembers = matches === 'env' ? changeMembers : elseChangeMembers!;
              const replacement = matchChangeMembers[index] ?? "";
              const indexInReplaced = i - (this.#result.length - replaced.length);
              replaced = (
                replaced.substring(0, indexInReplaced)
                + replacement
                + replaced.substring(indexInReplaced + 1)
              );
            }
          }
        }
        this.#result = replaced;
      } else if(change.every(isLiteral)) {
        // With constant text
        if(elseChange && !elseChange.every(isLiteral)) {
          return failure("Change and else are not of the same form");
        }
        const changeString = tokensToString(change);
        const elseChangeString = elseChange && tokensToString(elseChange);
        let replaced = this.#result;
        for(let i = 0; i < this.#result.length; ++i) {
          if(targetMembers.includes(this.#result[i])) {
            const matches = this.#resultMatchesLocalEnvOrExpAt(env, exp, i, 1);
            if(matches && !(matches === 'exp' && !elseChange)) {
              const matchChangeString = matches === 'env' ? changeString : elseChangeString!;
              const indexInReplaced = i - (this.#result.length - replaced.length);
              replaced = (
                replaced.substring(0, indexInReplaced)
                + matchChangeString
                + replaced.substring(indexInReplaced + 1)
              );
            }
          }
        }
        this.#result = replaced;
      } else {
        return failure("Invalid change");
      }
    } else if(target.every(isLiteral)) {
      // Constant text replacement
      if(!change.every(isLiteral)) {
        // With a category
        return failure("Invalid change");
      } else if(elseChange && !elseChange.every(isLiteral)) {
        // With a category
        return failure("Invalid else");
      } else {
        // With constant text
        const targetString = tokensToString(target);
        const changeString = tokensToString(change);
        const elseChangeString = elseChange && tokensToString(elseChange);
        let replaced = this.#result;
        for(let i = 0; i <= this.#result.length; ) {
          const nextTargetIndex = this.#result.indexOf(targetString, i);
          if(nextTargetIndex === -1) {
            break;
          }

          const matches = this.#resultMatchesLocalEnvOrExpAt(
            env, exp, nextTargetIndex, targetString.length
          );
          if(matches && !(matches === 'exp' && !elseChange)) {
            const matchChangeString = matches === 'env' ? changeString : elseChangeString!;
            const ntiInReplaced = nextTargetIndex - (this.#result.length - replaced.length);
            replaced = (
              replaced.substring(0, ntiInReplaced)
              + matchChangeString
              + replaced.substring(ntiInReplaced + targetString.length)
            );
            i = nextTargetIndex + Math.max(targetString.length, 1);
          } else {
            i = nextTargetIndex + 1;
          }
        }
        this.#result = replaced;
      }
    } else {
      return failure("Invalid target");
    }
  }

  #isCategory(segment: IRuleToken[]) {
    return segment.length === 1 && isCategory(segment[0]) || segment.some(isComma);
  }

  #getCategoryMembers(segment: IRuleToken[]) {
    if(segment.length === 1) {
      const targetMembers = this.#categories.get(segment[0].char);
      if(!targetMembers) {
        throw new TypeError(`Invalid category ${segment[0].char}`);
      }
      return targetMembers;
    } else if(segment.some(isComma)) {
      return segment.flatMap(t => isComma(t) ? [] : [t.char]);
    } else {
      throw new SyntaxError("Internal error (invalid category provided)");
    }
  }

  #charMatchesToken(char: string, token: IRuleToken) {
    switch(token.type) {
      case 'category': {
        const members = this.#categories.get(token.char);
        if(!members) {
          throw new TypeError(`Unknown category: ${token.char}`);
        }
        return members.includes(char);
      }

      case 'literal':
        return token.char === char;

      default:
        throw new Error(`Invalid token type: ${token.type}`);
    }
  }

  #resultMatchesSingleLocalConditionAt(
    condition: IRuleToken[], start: number, checkLength: number
  ) {
    let underscoreIndex = condition.findIndex(isUnderscore);
    if(underscoreIndex === -1) {
      return this.#resultMatchesSingleGlobalCondition(condition);
    } else if(underscoreIndex !== findLastIndex(condition, isUnderscore)) {
      throw new SyntaxError("Multiple underscores (shouldn't happen)");
    }
    if(isHashtag(condition[0])) {
      // At beginning of result
      --underscoreIndex;
      if(start !== underscoreIndex) {
        return false;
      }
      condition = condition.slice(1);
    }
    if(isHashtag(condition[condition.length - 1])) {
      // At end of result
      const charsAfterUnderscore = condition.length - 1 - (underscoreIndex + 1);
      if(start + checkLength + charsAfterUnderscore !== this.#result.length) {
        return false;
      }
      condition = condition.slice(0, -1);
    }
    if(condition.some(isHashtag)) {
      throw new SyntaxError("Hashtag in middle of condition");
    }
    if(start < underscoreIndex) {
      // Too far to the left
      return false;
    }
    const charsAfterUnderscore = condition.length - underscoreIndex - 1;
    const charsAfterMatch = this.#result.length - (start + checkLength);
    if(charsAfterMatch < charsAfterUnderscore) {
      // Too far to the right
      return false;
    }

    for(let i = 0; i < underscoreIndex; ++i) {
      const char = this.#result[start - underscoreIndex + i];
      if(!this.#charMatchesToken(char, condition[i])) {
        return false;
      }
    }
    for(let i = underscoreIndex + 1; i < condition.length; ++i) {
      const char = this.#result[start + checkLength + i - (underscoreIndex + 1)];
      if(!this.#charMatchesToken(char, condition[i])) {
        return false;
      }
    }
    return true;
  }

  #resultMatchesLocalEnvOrExpAt(
    env: IRuleToken[] | undefined, exp: IRuleToken[] | undefined, start: number,
    checkLength: number
  ) {
    if(exp && exp.length > 0) {
      const expConditions = splitTokens(exp, 'pipe');
      const matchesExp = expConditions.some(condition => (
        this.#resultMatchesSingleLocalConditionAt(condition, start, checkLength)
      ));
      if(matchesExp) {
        return 'exp';
      }
    }
    if(!env || env.length === 0) {
      return (exp && exp.length === 0) ? 'exp' : 'env';
    }
    const envConditions = splitTokens(env, 'pipe');
    const matchesEnv = envConditions.some(condition => (
      this.#resultMatchesSingleLocalConditionAt(condition, start, checkLength)
    ));
    if(matchesEnv) {
      return 'env';
    }
    return (exp && exp.length === 0) ? 'exp' : false;
  }

  #resultMatchesGlobalEnvOrExp(
    env: IRuleToken[] | undefined, exp: IRuleToken[] | undefined
  ) {
    if(exp && exp.length > 0) {
      const expConditions = splitTokens(exp, 'pipe');
      const matchesExp = expConditions.some(
        condition => this.#resultMatchesSingleGlobalCondition(condition)
      );
      if(matchesExp) {
        return 'exp';
      }
    }
    if(!env || env.length === 0) {
      return (exp && exp.length === 0) ? 'exp' : 'env';
    }
    const envConditions = splitTokens(env, 'pipe');
    const matchesEnv = envConditions.some(
      condition => this.#resultMatchesSingleGlobalCondition(condition)
    );
    if(matchesEnv) {
      return 'env';
    }
    return (exp && exp.length === 0) ? 'exp' : false;
  }

  #resultMatchesSingleGlobalCondition(condition: IRuleToken[]) {
    if(condition.some(isUnderscore)) {
      throw new SyntaxError("Underscore in global condition");
    }
    const hashtagIndex = condition.findIndex(isHashtag);
    if(hashtagIndex === -1) {
      // Word contains condition
      let matchIndex = 0;
      for(let i = 0; i < this.#result.length; ++i) {
        if(this.#charMatchesToken(this.#result[i], condition[matchIndex])) {
          ++matchIndex;
          if(matchIndex === condition.length) {
            return true;
          }
        } else {
          matchIndex = 0;
        }
      }
      return false;
    } else if(hashtagIndex !== findLastIndex(condition, isHashtag)) {
      throw new SyntaxError("Multiple hashtags (shouldn't happen)");
    }

    if(hashtagIndex === 0) {
      const prefix = condition.slice(1);
      if(this.#result.length < prefix.length) {
        return false;
      }
      for(let i = 0; i < prefix.length; ++i) {
        if(!this.#charMatchesToken(this.#result[i], prefix[i])) {
          return false;
        }
      }
    } else if(hashtagIndex === condition.length - 1) {
      const suffix = condition.slice(0, -1);
      if(this.#result.length < suffix.length) {
        return false;
      }
      const checkStart = this.#result.length - suffix.length;
      for(let i = 0; i < suffix.length; ++i) {
        if(!this.#charMatchesToken(this.#result[checkStart + i], suffix[i])) {
          return false;
        }
      }
    } else {
      throw new SyntaxError("Hastag in middle of condition");
    }
    return true;
  }
}

const scaCategories = [
  { letter: "C", members: "bcdfghjklmnpqrstvwxz".split("") },
  { letter: "V", members: "aeiouy".split("") },
  { letter: "W", members: "ABCDEF".split("") },
  { letter: "X", members: "123456".split("") }
];

const theSca = new SCA(scaCategories);

function runTests() {
  const tests = readFileSync("src/sca/sca-test.txt").toString().split("\n===\n").map(
    line => line.split("\n")
  );
  let lineNumber = 1;
  for(const [i, [initial, expected, ...rules]] of tests.entries()) {
    const setRulesResult = theSca.setRules(rules.join("\n"));
    if(!setRulesResult.success) {
      console.error(`SCA test #${i + 1} (line ${lineNumber}): ${setRulesResult.message}`);
      continue;
    }
    const actual = theSca.applySoundChanges(initial);
    if(!actual.success) {
      console.error(`SCA test #${i + 1} (line ${lineNumber}): ${actual.message}`);
    } else if(actual.result !== expected) {
      console.error(
        `SCA test #${i + 1} (line ${lineNumber}): expected ${expected}, got ${actual.result}`
      );
    }
    lineNumber += rules.length + 3;
  }
}

runTests();
