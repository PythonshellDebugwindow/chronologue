import express from 'express';
import type { ErrorRequestHandler } from 'express';

import * as families from './routes/families.js';
import * as grammar from './routes/grammar.js';
import * as languages from './routes/languages.js';
import * as phonology from './routes/phonology.js';
import * as words from './routes/words.js';
import * as sca from './sca/sca.js';

const app = express();
const port = process.env.EXPRESS_PORT!;

app.use(express.json());
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

app.get('/families', families.getAllFamilies);
app.post('/families', families.addFamily);
app.get('/families/:id', families.getFamily);
app.put('/families/:id', families.editFamily);
app.delete('/families/:id', families.deleteFamily);
app.get('/families/:id/members', families.getFamilyMembers);

app.get('/grammar-forms', grammar.getGrammarForms);
app.put('/grammar-forms', grammar.updateGrammarForms);

app.post('/grammar-tables', grammar.addGrammarTable);
app.get('/grammar-tables/:id', grammar.getGrammarTable);
app.put('/grammar-tables/:id', grammar.editGrammarTable);
app.delete('/grammar-tables/:id', grammar.deleteGrammarTable);
app.get('/grammar-tables/:id/classes', grammar.getGrammarTableClasses);
app.get('/grammar-tables/:id/class-ids', grammar.getGrammarTableClassIds);
app.get('/grammar-tables/:id/filled-cells', grammar.getGrammarTableFilledCells);
app.get('/grammar-tables/:id/irregular-forms/:word', grammar.getIrregularForms);
app.put('/grammar-tables/:id/irregular-forms/:word', grammar.updateIrregularForms);
app.get('/grammar-tables/:id/random-word', grammar.getRandomWordForGrammarTable);
app.post('/grammar-tables/:id/run-on-word', grammar.runGrammarTableOnWord);

app.get('/language-isolates', families.getLanguageIsolates);

app.post('/languages', languages.addLanguage);
app.get('/languages/:id', languages.getLanguage);
app.put('/languages/:id', languages.editLanguage);
app.delete('/languages/:id', languages.deleteLanguage);
app.put('/languages/:id/alphabetical-order', languages.updateAlphabeticalOrder);
app.post('/languages/:id/apply-sca-rules', phonology.applySCARules);
app.get('/languages/:id/descendants', languages.getDescendants);
app.get('/languages/:id/dictionary-settings', languages.getDictionarySettings);
app.put('/languages/:id/dictionary-settings', languages.updateDictionarySettings);
app.post('/languages/:id/estimate-ipa', phonology.estimateWordIPA);
app.get('/languages/:id/grammar-tables', grammar.getLanguageGrammarTables);
app.post('/languages/:id/import-words', words.importWords);
app.post('/languages/:id/mass-edit-dictionary', words.massEditLanguageDictionary);
app.get('/languages/:id/orth-categories', phonology.getOrthographyCategories);
app.put('/languages/:id/orth-categories', phonology.updateOrthographyCategories);
app.get('/languages/:id/orth-settings', languages.getOrthographySettings);
app.put('/languages/:id/orth-settings', languages.updateOrthographySettings);
app.get('/languages/:id/phone-categories', phonology.getPhoneCategories);
app.put('/languages/:id/phone-categories', phonology.updatePhoneCategories);
app.get('/languages/:id/phones', phonology.getPhones);
app.put('/languages/:id/phones', phonology.updatePhones);
app.get('/languages/:id/pos-word-stems/:pos', grammar.getLanguageWordStemsByPos);
app.get('/languages/:id/pronunciation-estimation', phonology.getPronunciationEstimation);
app.put('/languages/:id/pronunciation-estimation', phonology.updatePronunciationEstimation);
app.delete('/languages/:id/purge-dictionary', words.purgeLanguageDictionary);
app.get('/languages/:id/summary-notes', languages.getSummaryNotes);
app.put('/languages/:id/summary-notes', languages.updateSummaryNotes);
app.get('/languages/:id/word-classes', words.getWordClassesByLanguage);
app.put('/languages/:id/word-classes', words.updateWordClasses);
app.get('/languages/:id/word-stems', grammar.getLanguageWordStems);
app.put('/languages/:id/word-stems', grammar.updateLanguageWordStems);
app.get('/languages/:id/words', words.getLanguageWords);
app.get('/languages/:id/word-count', words.getLanguageWordCount);

app.get('/parts-of-speech', words.getPartsOfSpeech);

app.get('/sca', sca.testSCA);

app.post('/words', words.addWord);
app.get('/words/:id', words.getWord);
app.put('/words/:id', words.editWord);
app.delete('/words/:id', words.deleteWord);
app.get('/words/:id/classes', words.getWordClassesByWord);
app.get('/words/:id/class-ids', words.getWordClassIdsByWord);
app.get('/words/:id/grammar-tables', grammar.getGrammarTablesForWord);

app.use(((err, req, res, _next) => {
  res.status(500).json({ title: "Internal error", message: err.message });
}) as ErrorRequestHandler);

app.listen(port, () => {
  console.log(`Express server listening on ${port}`);
});
