if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.de = {
  // Session-state buttons for the main toolbar
  'Save': 'Speichern',
  'Saving': 'Speichert',
  'Cancel': 'Abbrechen',
  'Edit': 'Bearbeiten',
  // Storage status messages
  'localModifications': '<%= number %> Einträge auf dieser Seite haben lokale Modifikationen',
  'Restore': 'Wiederherstellen',
  'Ignore': 'Ignorieren',
  'saveSuccess': 'Eintrag "<%= label %>" erforlgreich gespeichert',
  'saveSuccessMultiple': '<%= number %> Einträge erfogreich gespeichert',
  'saveError': 'Beim Speichern trat ein Fehler auf<br /><%= error %>',
  // Tagging
  'Item tags': 'Schlagwörter des Eintrags',
  'Suggested tags': 'Schlagwortvorschläge',
  'Tags': 'Schlagwörter',
  'add a tag': 'Schlagwort hinzufügen',
  // Collection widgets
  'Add': 'Hinzufügen',
  'Choose type to add': 'Typ zum Hinzufügen wählen'
};
