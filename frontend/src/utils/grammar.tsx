import { Fragment } from 'react';

import { IGrammarForm, IGrammarTableOverview } from '@/types/grammar';

export function compareGrammarTables(t1: IGrammarTableOverview, t2: IGrammarTableOverview) {
  if(t1.pos !== t2.pos) {
    return t1.pos.localeCompare(t2.pos);
  } else if(t1.name !== t2.name) {
    return t1.name.localeCompare(t2.name);
  } else {
    return t1.id.localeCompare(t2.id);
  }
}

export function formatPeriodSeparatedGrammarForms(code: string, grammarForms: IGrammarForm[]) {
  return code.split(".").map((code, i) => {
    const period = i > 0 ? "." : "";
    if(code === "Ø") {
      return period + code;
    }
    const form = grammarForms.find(form => form.code === code);
    const formName = form?.name ?? "unknown";
    const formStyle = form ? {} : { color: "red" };
    const formNode = <abbr title={formName} style={formStyle}>{code}</abbr>;
    return <Fragment key={i}>{period}{formNode}</Fragment>
  });
}

export function formatTextWithGrammarForms(text: string, grammarForms: IGrammarForm[]) {
  const result = [];
  const formRegexp = /(?<!\p{L}|\p{N})((?:\p{Lu}|\p{N})+)(?=$|\P{L})/gu;
  let prevEnd = 0;
  let match;
  while((match = formRegexp.exec(text)) !== null) {
    const before = text.substring(prevEnd, match.index);
    const code = match[1];
    if(code === "Ø") {
      result.push(before + code);
    } else {
      const form = grammarForms.find(form => form.code === code);
      const formName = form?.name ?? "unknown";
      const formStyle = form ? {} : { color: "red" };
      const formNode = <abbr title={formName} style={formStyle} key={match.index}>{code}</abbr>;
      result.push(before);
      result.push(formNode);
    }
    prevEnd = formRegexp.lastIndex;
  }
  if(prevEnd < text.length) {
    result.push(text.substring(prevEnd));
  }
  return result;
}
