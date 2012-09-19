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
  'localModification': 'Dokumentilla "<%= label %>" on paikallisia muutoksia',
  'localModifications': '<%= number %> dokumenttia sivulla omaa paikallisia muutoksia',
  'Restore': 'Palauta',
  'Ignore': 'Poista',
  'saveSuccess': 'Dokumentti "<%= label %>" tallennettu',
  'saveSuccessMultiple': '<%= number %> dokumenttia tallennettu',
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
