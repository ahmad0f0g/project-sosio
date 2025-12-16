import { createRequire } from "module";
const require = createRequire(import.meta.url);

const en = require("../locales/en.json");
const id = require("../locales/id.json");

const language = (req, res, next) => {
  const lang = req.headers["accept-language"] || "id";

  req.t = (key) => {
    if (lang && lang.startsWith("en")) {
      return en[key] || key;
    }
    return id[key] || key;
  };

  next();
};

export default language;