import express from 'express';
import type { ErrorRequestHandler } from 'express';

import * as articles from './routes/articles.js';
import * as dictionary from './routes/dictionary.js'
import * as families from './routes/families.js';
import * as grammar from './routes/grammar.js';
import * as grammarTables from './routes/grammarTables.js';
import * as languages from './routes/languages.js';
import * as phonology from './routes/phonology.js';
import * as recentActivity from './routes/recentActivity.js';
import * as translations from './routes/translations.js';
import * as words from './routes/words.js';

import * as sca from './sca/sca.js';

const app = express();
const port = process.env.EXPRESS_PORT!;

app.use(/^(?!\/languages\/.*?\/import-words$)/, express.json());
app.use(/^\/languages\/.*?\/import-words$/, express.json({ limit: '50mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL!);
  res.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, GET, POST, PUT');
  next();
});
app.use((req, res, next) => {
  console.log(req.url, req.body);
  next();
});

app.get('/article-folders', articles.getArticleFolders);
app.put('/article-folders', articles.updateArticleFolders);

app.get('/article-tags', articles.getExistingTags);

app.get('/articles', articles.getAllArticles);
app.post('/articles', articles.addArticle);
app.get('/articles/:id', articles.getArticle);
app.put('/articles/:id', articles.editArticle);
app.delete('/articles/:id', articles.deleteArticle);

app.get('/families', families.getAllFamilies);
app.post('/families', families.addFamily);
app.get('/families/:id', families.getFamily);
app.put('/families/:id', families.editFamily);
app.delete('/families/:id', families.deleteFamily);
app.get('/families/:id/members', families.getFamilyMembers);

app.get('/grammar-forms', grammar.getGrammarForms);
app.put('/grammar-forms', grammar.updateGrammarForms);

app.post('/grammar-tables', grammarTables.addGrammarTable);
app.get('/grammar-tables/:id', grammarTables.getGrammarTable);
app.put('/grammar-tables/:id', grammarTables.editGrammarTable);
app.delete('/grammar-tables/:id', grammarTables.deleteGrammarTable);
app.get('/grammar-tables/:id/classes', grammarTables.getGrammarTableClasses);
app.get('/grammar-tables/:id/class-ids', grammarTables.getGrammarTableClassIds);
app.get('/grammar-tables/:id/filled-cells', grammarTables.getGrammarTableFilledCells);
app.get('/grammar-tables/:id/irregular-forms/:word', grammar.getIrregularForms);
app.put('/grammar-tables/:id/irregular-forms/:word', grammar.updateIrregularForms);
app.get('/grammar-tables/:id/random-word', grammarTables.getRandomWordForGrammarTable);
app.post('/grammar-tables/:id/run-on-word', grammarTables.runGrammarTableOnWord);

app.get('/language-isolates', families.getLanguageIsolates);

app.post('/languages', languages.addLanguage);
app.get('/languages/:id', languages.getLanguage);
app.put('/languages/:id', languages.editLanguage);
app.delete('/languages/:id', languages.deleteLanguage);
app.put('/languages/:id/alphabetical-order', languages.updateAlphabeticalOrder);
app.post('/languages/:id/apply-sca-rules', phonology.applySCARules);
app.get('/languages/:id/derivation-rules', dictionary.getLanguageDerivationRulesets);
app.get('/languages/:id/derivation-rules/:srcId', dictionary.getDerivationRules);
app.put('/languages/:id/derivation-rules/:srcId', dictionary.editDerivationRules);
app.delete('/languages/:id/derivation-rules/:srcId', dictionary.deleteDerivationRules);
app.get('/languages/:id/derive-first-word/:destId', dictionary.getLanguageFirstWordDerivation);
app.get('/languages/:id/descendants', languages.getDescendants);
app.get('/languages/:id/dictionary-settings', languages.getDictionarySettings);
app.put('/languages/:id/dictionary-settings', languages.updateDictionarySettings);
app.post('/languages/:id/estimate-ipa', phonology.estimateWordIPA);
app.get('/languages/:id/grammar-tables', grammarTables.getLanguageGrammarTables);
app.post('/languages/:id/homonyms', dictionary.getLanguageStringHomonyms);
app.post('/languages/:id/import-words', dictionary.importWords);
app.get('/languages/:id/irregular-forms', grammar.getLanguageIrregularForms);
app.get('/languages/:id/letter-distribution', dictionary.getLanguageLetterDistribution);
app.post('/languages/:id/mass-edit-dictionary', dictionary.massEditLanguageDictionary);
app.get('/languages/:id/orth-categories', phonology.getOrthographyCategories);
app.put('/languages/:id/orth-categories', phonology.updateOrthographyCategories);
app.get('/languages/:id/orth-settings', languages.getOrthographySettings);
app.put('/languages/:id/orth-settings', languages.updateOrthographySettings);
app.get('/languages/:id/phone-categories', phonology.getPhoneCategories);
app.put('/languages/:id/phone-categories', phonology.updatePhoneCategories);
app.get('/languages/:id/phones', phonology.getPhones);
app.put('/languages/:id/phones', phonology.updatePhones);
app.get('/languages/:id/pos-distribution', dictionary.getLanguagePosDistribution);
app.get('/languages/:id/pos-word-stems/:pos', grammar.getLanguageWordStemsByPos);
app.get('/languages/:id/pronunciation-estimation', phonology.getPronunciationEstimation);
app.put('/languages/:id/pronunciation-estimation', phonology.updatePronunciationEstimation);
app.delete('/languages/:id/purge-dictionary', dictionary.purgeLanguageDictionary);
app.get('/languages/:id/summary-notes', languages.getSummaryNotes);
app.put('/languages/:id/summary-notes', languages.updateSummaryNotes);
app.post('/languages/:id/synonyms', dictionary.getLanguageStringSynonyms);
app.get('/languages/:id/translation-ids', translations.getLanguageTranslationIds);
app.get('/languages/:id/translations', translations.getAllLanguageTranslations);
app.get('/languages/:id/word-class-distribution/:pos', dictionary.getLanguageClassDistribution);
app.get('/languages/:id/word-classes', dictionary.getWordClassesByLanguage);
app.put('/languages/:id/word-classes', dictionary.updateWordClasses);
app.get('/languages/:id/word-count', dictionary.getLanguageWordCount);
app.get('/languages/:id/word-stems', grammar.getLanguageWordStems);
app.put('/languages/:id/word-stems', grammar.updateLanguageWordStems);
app.get('/languages/:id/words', dictionary.getLanguageWords);
app.get('/languages/:id/words-with-classes', dictionary.getLanguageWordsWithClasses);

app.get('/parts-of-speech', dictionary.getPartsOfSpeech);

app.get('/recent-activity', recentActivity.getRecentActivity);

app.get('/sca', sca.testSCA);

app.get('/translations', translations.getAllTranslations);
app.post('/translations', translations.addTranslation);
app.get('/translations/:id', translations.getTranslation);
app.put('/translations/:id', translations.editTranslation);
app.delete('/translations/:id', translations.deleteTranslation);
app.get('/translations/:id/languages', translations.getTranslationLanguages);
app.get('/translations/:id/languages/:langId', translations.getLanguageTranslation);
app.put('/translations/:id/languages/:langId', translations.addLanguageTranslation);
app.delete('/translations/:id/languages/:langId', translations.deleteLanguageTranslation);

app.post('/words', words.addWord);
app.get('/words/:id', words.getWord);
app.put('/words/:id', words.editWord);
app.delete('/words/:id', words.deleteWord);
app.get('/words/:id/classes', words.getWordClassesByWord);
app.get('/words/:id/class-ids', words.getWordClassIdsByWord);
app.get('/words/:id/derivation/:langId', words.getDerivationIntoLanguage);
app.get('/words/:id/derive-next-word/:destId', dictionary.getLanguageNextWordDerivation);
app.get('/words/:id/descendants', words.getWordDescendants);
app.get('/words/:id/grammar-tables', grammarTables.getGrammarTablesForWord);
app.get('/words/:id/homonyms', words.getLanguageWordHomonyms);
app.get('/words/:id/irregular-stems', grammar.getIrregularStemsForWord);
app.get('/words/:id/overview-with-language', words.getWordOverviewWithLanguage);
app.get('/words/:id/overview-with-language-status', words.getWordOverviewWithLanguageStatus);
app.get('/words/:id/synonyms', words.getLanguageWordSynonyms);

app.use(((err, req, res, _next) => {
  res.status(500).json({ title: "Internal error", message: err.message });
}) as ErrorRequestHandler);

app.listen(port, () => {
  console.log(`Express server listening on ${port}`);
});
