if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.pl = {
  // Session-state buttons for the main toolbar
  'Save': 'Zapisz',
  'Saving': 'Zapisuję',
  'Cancel': 'Anuluj',
  'Edit': 'Edytuj',
  // Storage status messages
  'localModification': 'Artykuł "<%= label %>" posiada lokalne modyfikacje',
  'localModifications': '<%= number %> artykułów na tej stronie posiada lokalne modyfikacje',
  'Restore': 'Przywróć',
  'Ignore': 'Ignoruj',
  'saveSuccess': 'Artykuł "<%= label %>" został poprawnie zapisany',
  'saveSuccessMultiple': '<%= number %> artykułów zostało poprawnie zapisanych',
  'saveError': 'Wystąpił błąd podczas zapisywania<br /><%= error %>',
  // Tagging
  'Item tags': 'Tagi artykułów',
  'Suggested tags': 'Sugerowane tagi',
  'Tags': 'Tagi',
  'add a tag': 'dodaj tag',
  // Collection widgets
  'Add': 'Dodaj',
  'Choose type to add': 'Wybierz typ do dodania'
};
