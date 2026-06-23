// Import every adapter for its self-registration side effect. Adding a backend =
// create the file and add one import line here.
import "./transcribe/llm-vision.adapter.js";
import "./transcribe/transkribus.adapter.js";
import "./transcribe/kraken.adapter.js";
import "./transcribe/demo.adapter.js";
import "./translate/llm.adapter.js";
import "./translate/demo.adapter.js";
import "./ner/llm.adapter.js";
