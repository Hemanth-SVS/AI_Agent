// config/gemini.js
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

if (!API_KEY) {
  console.error("❌ No API key provided");
  process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

module.exports = { genAI, DEFAULT_MODEL };
