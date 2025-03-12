export const consonantPhones = [
  "m̥ m ɱ̊ ɱ n̪̊ n̪ n̥ n * * ɳ̊ ɳ ȵ̊ ȵ ɲ̊ ɲ * ŋ͡m ŋ̊ ŋ ɴ̥ ɴ * * * * * *",
  "p b p̪ b̪ t̪ d̪ t d * * ʈ ɖ ȶ ȡ c ɟ k͡p ɡ͡b k g q ɢ ʡ * ʔ * * *",
  "p͡ɸ b͡β p̪͡f b̪͡v t̪͡θ d̪͡ð t͡s d͡z t͡ʃ d͡ʒ ʈ͡ʂ ɖ͡ʐ t͡ɕ d͡ʑ c͡ç ɟ͡ʝ * * k͡x g͡ɣ q͡χ ɢ͡ʁ ʡ͡ʜ ʡ͡ʢ ʔ͡h * * *",
  "ɸ β f v θ ð s z ʃ ʒ ʂ ʐ ɕ ʑ ç ʝ * * x ɣ χ ʁ ħ ʕ h ɦ ɧ *",
  "β̞̊ β̞ ʋ̥ ʋ ð̞̊ ð̞ ɹ̥ ɹ * * ɻ̊ ɻ * * j̊ j ʍ w ɰ̊ ɰ ʁ̞̊ ʁ̞ * * * * ɥ̊ ɥ",
  "ⱱ̟̊ ⱱ̟ ⱱ̥ ⱱ ɾ̪̊ ɾ̪ ɾ̥ ɾ * * ɽ̊ ɽ * * * * * * * * q̆ ɢ̆ * ʡ̆ * * * *",
  "ʙ̥ ʙ * * r̪̊ r̪ r̥ r * * * * * * * * * * * * ʀ̥ ʀ ʜ ʢ * * * *",
  "* * * * * * t͡ɬ d͡ɮ * * ʈ͡ꞎ ɖ͡ɭ˔ * * c͡ʎ̥˔ ɟ͡ʎ̝ * * k͡ʟ̝̊ ɡ͡ʟ̝ * * * * * * * *",
  "* * * * ɬ̪ ɮ̪ ɬ ɮ * * ꞎ ɭ˔ * * ʎ̝̊ ʎ̝ * * ʟ̝̊ ʟ̝ * * * * * * * *",
  "* * * * l̪̊ l̪ l̥ l * * ɭ̊ ɭ ȴ̊ ȴ ʎ̥ ʎ * * ʟ̥ ʟ * * * * * * ɫ̥ ɫ",
  "* * * * ɺ̪̊ ɺ̪ ɺ̥ ɺ * * * * * * * * * * * * * * * * * * * *",
  "ʘ * * * ǀ * ǃ * * * ‼ * ǁ * ǂ * * * ʞ * * * * * * * * *",
  "ɓ̥ ɓ * * ɗ̪̊ ɗ̪ ɗ̥ ɗ * * ᶑ̥ ᶑ * * ʄ̥ ʄ * * ɠ̊ ɠ ʛ̥ ʛ * * * * * *"
].map(row => row.replace(/\*/g, "").split(" "))

export const vowelPhones = [
  "i y * * ɨ ʉ * * ɯ u",
  "* * ɪ ʏ ɪ̈ ʊ̈ * ʊ * *",
  "e ø * * ɘ ɵ * * ɤ o",
  "e̞ ø̞ * * ə * * * ɤ̞ o̞",
  "ɛ œ * * ɜ ɞ * * ʌ ɔ",
  "æ * * * ɐ * * * * *",
  "a ɶ * * ä * * * ɑ ɒ"
].map(row => row.replace(/\*/g, "").split(" "))

export const qualityData = new Map([
  ["Advanced", "a̟"],
  ["Advanced tongue root", "a̘"],
  ["Alveolar", "a͇"],
  ["Apical", "a̺"],
  ["Aspirated", "aʰ"],
  ["Bidental", "a̪͆"],
  ["Breathy voiced", "aʱ"],
  ["Centralised", "ä"],
  ["Compressed", "aᵝ"],
  ["Creaky voiced", "a̰"],
  ["Dental", "a̪"],
  ["Double-long", "a::"],
  ["Ejective", "aʼ"],
  ["Epiglottalised", "aᵸ"],
  ["Extra-short", "ă"],
  ["Glottalised", "aˀ"],
  ["Half-long", "aˑ"],
  ["Ingressive", "↓a"],
  ["Iotated", "ʲa"],
  ["Labialised", "aʷ"],
  ["Labio-palatalised", "aᶣ"],
  ["Laminal", "a̻"],
  ["Lateral release", "aˡ"],
  ["Less rounded", "a̜"],
  ["Linguolabial", "a̼"],
  ["Long", "a:"],
  ["Lowered", "a̞"],
  ["Mid-centralised", "a̽"],
  ["More rounded", "a̹"],
  ["Nareal fricative", "a͋"],
  ["Nasalised", "ã"],
  ["No audible release", "a̚"],
  ["Non-syllabic", "a̯"],
  ["Palatalised", "aʲ"],
  ["Pharyngealised", "aˤ"],
  ["Preaspirated", "ʰa"],
  ["Preglottalised", "ˀa"],
  ["Prelabialised", "ʷa"],
  ["Prelabio-palatalised", "ᶣa"],
  ["Prenasalised", "ⁿa"],
  ["Raised", "a̝"],
  ["Retracted", "a̠"],
  ["Retracted tongue root", "a̙"],
  ["Rhotacised", "a˞"],
  ["Sibilated", "aˢ"],
  ["Syllabic", "a̩"],
  ["Tone - Dipping", "a᷉"],
  ["Tone - Extra high", "a̋"],
  ["Tone - Extra low", "ȁ"],
  ["Tone - Falling", "â"],
  ["Tone - High", "á"],
  ["Tone - High falling", "a᷇"],
  ["Tone - High rising", "a᷄"],
  ["Tone - Low", "à"],
  ["Tone - Low falling", "a᷆"],
  ["Tone - Low rising", "a᷅"],
  ["Tone - Mid", "ā"],
  ["Tone - Peaking", "a᷈"],
  ["Tone - Rising", "ǎ"],
  ["Uvularised", "aʶ"],
  ["Velarised", "aˠ"],
  ["Velopharyngeal", "a͌"],
  ["Voiced", "a̬"],
  ["Voiceless", "ḁ"]
]);

const combiningQualities = [...qualityData.keys()].filter(
  name => /\p{M}/u.test(qualityData.get(name)!)
);
const finalQualities = ["Aspirated", "Breathy voiced", "Ejective", "Preaspirated", "Prenasalised"];
const noncombiningQualities = [...qualityData.keys()].filter(
  name => !/\p{M}/u.test(qualityData.get(name)!) &&
          !finalQualities.includes(name)
);

function getPrenasalSymbol(base: string) {
  if(["ʃ", "ʒ", "t͡ʃ", "d͡ʒ"].includes(base)) {
    return "ᶮ";
  }
  const baseRow = consonantPhones.find(row => row.includes(base));
  if(!baseRow) {
    return "ⁿ";
  }
  const placeNasal = consonantPhones[0][baseRow.indexOf(base)];
  return {
    "m̥": "ᵐ", "m": "ᵐ",
    "ɱ̊": "ᶬ", "ɱ": "ᶬ",
    "ɳ̊": "ᶯ", "ɳ": "ᶯ",
    "ɲ̊": "ᶮ", "ɲ": "ᶮ",
    "ŋ̊": "ᵑ", "ŋ": "ᵑ",
    "ɴ̥": "ᶰ", "ɴ": "ᶰ"
  }[placeNasal] ?? "ⁿ";
}

interface IPartialPhone {
  base: string;
  qualities: string[];
}

export function phoneToString(phone: IPartialPhone) {
  let result = phone.base;
  for(const quality of phone.qualities) {
    if(combiningQualities.includes(quality)) {
      const symbol = qualityData.get(quality) ?? "a";
      result = symbol.replace("a", result);
    }
  }
  for(const quality of phone.qualities) {
    if(noncombiningQualities.includes(quality)) {
      const symbol = qualityData.get(quality) ?? "a";
      if(symbol[0] === "ⁿ") {
        result = getPrenasalSymbol(phone.base) + result;
      } else {
        result = symbol.replace("a", result);
      }
    }
  }
  for(const quality of phone.qualities) {
    if(finalQualities.includes(quality)) {
      const symbol = qualityData.get(quality) ?? "a";
      result = symbol.replace("a", result);
    }
  }
  return result;
};
