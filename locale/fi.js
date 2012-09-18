if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.fi = {
  // Session-state buttons for the main toolbar
  'Save': 'Tallenna',
  'Saving': 'Tallennetaan',
  'Cancel': 'Peruuta',
  'Edit': 'Muokkaa',
  // Storage status messages
  'localModifications': '<%= number %> oliota sivulla omaa paikallisia muutoksia',
  'Restore': 'Palauta',
  'Ignore': 'Poista',
  'saveSuccess': 'Olio "<%= label %>" tallennettu',
  'saveSuccessMultiple': '<%= number %> oliota tallennettu',
  'saveError': 'Virhe tallennettaessa<br /><%= error %>',
  // Tagging
  'Item tags': 'Avainsanat',
  'Suggested tags': 'Ehdotukset',
  'Tags': 'Avainsanat',
  'add a tag': 'lisää avainsana',
  // Collection widgets
  'Add': 'Lisää',
  'Choose type to add': 'Mitä haluat lisätä?'
};
