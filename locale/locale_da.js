if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.da = {
  // Session-state buttons for the main toolbar
  'Save': 'Gem',
  'Saving': 'Gemmer',
  'Cancel': 'Annullér',
  'Edit': 'Rediger',
  // Storage status messages
  'localModification': 'Element "<%= label %>" har lokale ændringer',
  'localModifications': '<%= number %> elementer på denne side har lokale ændringer',
  'Restore': 'Gendan',
  'Ignore': 'Ignorer',
  'saveSuccess': 'Element "<%= label %>" er gemt',
  'saveSuccessMultiple': '<%= number %> elementer er gemt',
  'saveError': 'Der opstod en fejl under lagring<br /><%= error %>',
  // Tagging
  'Item tags': 'Element tags',
  'Suggested tags': 'Foreslåede tags',
  'Tags': 'Tags',
  'add a tag': 'tilføj et tag',
  // Collection widgets
  'Add': 'Tilføj',
  'Choose type to add': 'Vælg type der skal tilføjes'
};
