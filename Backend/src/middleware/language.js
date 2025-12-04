import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Memuat file JSON menggunakan require
const en = require("../locales/en.json");
const id = require("../locales/id.json");

const language = (req, res, next) => {
  // Ambil bahasa dari header, default ke 'id' (Indonesia)
  const lang = req.headers["accept-language"] || "id";

  // Fungsi helper req.t untuk menerjemahkan
  req.t = (key) => {
    // Jika bahasa client diawali 'en' (English), pakai file en.json
    if (lang && lang.startsWith("en")) {
      return en[key] || key;
    }
    // Selain itu pakai bahasa Indonesia
    return id[key] || key;
  };

  next();
};

export default language;