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
  'localModification': 'Das Dokument "<%= label %>" auf dieser Seite hat lokale Änderungen',
  'localModifications': '<%= number %> Dokumente auf dieser Seite haben lokale Änderungen',
  'Restore': 'Wiederherstellen',
  'Ignore': 'Ignorieren',
  'saveSuccess': 'Dokument "<%= label %>" erfolgreich gespeichert',
  'saveSuccessMultiple': '<%= number %> Dokumente erfolgreich gespeichert',
  'saveError': 'Fehler beim Speichern<br /><%= error %>',
  // Tagging
  'Item tags': 'Schlagwörter des Dokuments',
  'Suggested tags': 'Schlagwortvorschläge',
  'Tags': 'Schlagwörter',
  'add a tag': 'Neues Schlagwort',
  // Collection widgets
  'Add': 'Hinzufügen',
  'Choose type to add': 'Typ zum Hinzufügen wählen'
};
