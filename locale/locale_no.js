if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.no = {
  // Session-state buttons for the main toolbar
  'Save': 'Lagre',
  'Saving': 'Lagrer',
  'Cancel': 'Avbryt',
  'Edit': 'Rediger',
  // Storage status messages
  'localModification': 'Element "<%= label %>" på denne siden er modifisert lokalt',
  'localModifications': '<%= number %> elementer på denne siden er modifisert lokalt',
  'Restore': 'Gjenopprett',
  'Ignore': 'Ignorer',
  'saveSuccess': 'Element "<%= label %>" ble lagret',
  'saveSuccessMultiple': '<%= number %> elementer ble lagret',
  'saveError': 'En feil oppstod under lagring<br /><%= error %>',
  // Tagging
  'Item tags': 'Element-tagger',
  'Suggested tags': 'Anbefalte tagger',
  'Tags': 'Tagger',
  'add a tag': 'legg til tagg',
  // Collection widgets
  'Add': 'Legg til',
  'Choose type to add': 'Velg type å legge til'
};
