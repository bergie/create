if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.nl = {
  // Session-state buttons for the main toolbar
  'Save': 'Opslaan',
  'Saving': 'Bezig met opslaan',
  'Cancel': 'Annuleren',
  'Edit': 'Bewerken',
  // Storage status messages
  'localModification': 'Items "<%= label %>" op de pagina heeft lokale wijzigingen',
  'localModifications': '<%= number %> items op de pagina hebben lokale wijzigingen',
  'Restore': 'Herstellen',
  'Ignore': 'Negeren',
  'saveSuccess': 'Item "<%= label %>" succesvol opgeslagen',
  'saveSuccessMultiple': '<%= number %> items succesvol opgeslagen',
  'saveError': 'Fout opgetreden bij het opslaan<br /><%= error %>',
  // Tagging
  'Item tags': 'Item tags',
  'Suggested tags': 'Tag suggesties',
  'Tags': 'Tags',
  'add a tag': 'tag toevoegen',
  // Collection widgets
  'Add': 'Toevoegen',
  'Choose type to add': 'Kies type om toe te voegen'
};
