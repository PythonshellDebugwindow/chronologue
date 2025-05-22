import { consonantPhones, phoneToString, vowelPhones } from '@shared/phones';

import { IOrthographySettings } from '@/types/languages';
import { IPhone, IPhoneTableData } from '@/types/phones';

import { assertUnreachable } from '@/utils/global/asserts';

export const consonantData: IPhoneTableData = {
  type: 'consonant',
  horizontal: [
    "Bilabial", <>Labio-<br />dental</>, "Dental", "Alveolar", <>Post-<br />alveolar</>,
    "Retroflex", <>Alveolo-<br />palatal</>, "Palatal", <>Labio-<br />velar</>, "Velar",
    "Uvular", <>Pharyngeal/<br />epiglottal</>, "Glottal", "Other"
  ],
  vertical: [
    "Nasal", "Plosive", "Affricate", "Fricative", "Approximant", "Tap/flap",
    "Trill", "Lateral affricate", "Lateral fricative", "Lateral approximant",
    "Lateral tap/flap", "Click", "Implosive"
  ],
  phones: consonantPhones
};

export const vowelData: IPhoneTableData = {
  type: 'vowel',
  horizontal: [
    "Front", <>Near-<br />front</>, "Central", <>Near-<br />back</>, "Back"
  ],
  vertical: [
    "Close", "Near-close", "Close-mid", "Mid", "Open-mid", "Near-open", "Open"
  ],
  phones: vowelPhones
};

export function formatGraphForAlphabet(graph: string, orthSettings: IOrthographySettings) {
  const formatType = getGraphFormatTypeForAlphabet(graph, orthSettings);
  switch(formatType) {
    case 'id':
      return graph;
    case 'upper-lower':
      return graph.toUpperCase() + graph;
    case 'upper-space-lower':
      return graph.toUpperCase() + " " + graph;
    default:
      assertUnreachable(formatType);
  }
}

export function formatPhoneForPhonologyTable(phone: IPhone) {
  const phoneString = phoneToString(phone);
  if(phone.isForeign) {
    return "(" + phoneString + ")";
  } else if(phone.isAllophone) {
    return "[" + phoneString + "]";
  } else {
    return phoneString;
  }
}

export function getGraphFormatTypeForAlphabet(graph: string, orthSettings: IOrthographySettings) {
  if(orthSettings.caseSensitive) {
    return 'id';
  }
  const upper = graph.toUpperCase();
  if(upper === graph) {
    return 'id';
  } else if(upper.replace(/\p{M}/gu, "").length >= 2) {
    return 'upper-space-lower';
  } else {
    return 'upper-lower';
  }
}

export function hasDoubleWidthCell(base: string) {
  return base === "ə" || base === "ɐ";
}

export function phoneToStringWithBrackets(phone: IPhone) {
  const phoneString = phoneToString(phone);
  if(phone.isForeign) {
    return "(" + phoneString + ")";
  } else if(phone.isAllophone) {
    return "[" + phoneString + "]";
  } else {
    return "/" + phoneString + "/";
  }
}
