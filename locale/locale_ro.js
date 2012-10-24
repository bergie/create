if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.ro = {
  // Session-state buttons for the main toolbar
  'Save': 'Salvează',
  'Saving': 'Se salvează',
  'Cancel': 'Anulează',
  'Edit': 'Editare',
  // Storage status messages
  'localModification': 'Zona "<%= label %>" a fost modificată',
  'localModifications': '<%= number %> zone din această pagină au fost modificate',
  'Restore': 'Revenire',
  'Ignore': 'Ignoră',
  'saveSuccess': 'Zona "<%= label %>" a fost salvată',
  'saveSuccessMultiple': '<%= number %> zone au fost salvate',
  'saveError': 'S-a produs o eroare în timpul salvării<br /><%= error %>',
  // Tagging
  'Item tags': 'Etichetele zonei',
  'Suggested tags': 'Etichete sugerate',
  'Tags': 'Etichete',
  'add a tag': 'adaugă o etichetă',
  // Collection widgets
  'Add': 'Adăugare',
  'Choose type to add': 'Alegeți un tip pentru adăugare'
};
