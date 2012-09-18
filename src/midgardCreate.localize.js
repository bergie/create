if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}

window.midgardCreate.localize = function (id, language) {
  if (!window.midgardCreate.locale) {
    // No localization files loaded, return as-is
    return id;
  }
  if (window.midgardCreate.locale[language] && window.midgardCreate.locale[language][id]) {
    return window.midgardCreate.locale[language][id];
  }
  if (window.midgardCreate.locale.en[id]) {
    return window.midgardCreate.locale.en[id];
  }
  return id;
};
