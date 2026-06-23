// Register adapters (model backends) before handlers that resolve them.
import '../../adapters/index.js';

// Import each handler for its self-registration side effect. Adding a job type =
// create the handler file and add one import line here.
import './preprocess.handler.js';
import './transcribe.handler.js';
import './translate.handler.js';
import './ner.handler.js';
import './export.handler.js';
import './batch.handler.js';
