if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.cs = {
  // Session-state buttons for the main toolbar
  'Save': 'Uložit',
  'Saving': 'Probíhá ukládání',
  'Cancel': 'Zrušit',
  'Edit': 'Upravit',
  // Storage status messages
  'localModification': 'Blok "<%= label %>" obsahuje lokální změny',
  'localModifications': '<%= number %> bloků na této stránce má lokální změny',
  'Restore': 'Aplikovat lokální změny',
  'Ignore': 'Zahodit lokální změny',
  'saveSuccess': 'Blok "<%= label %>" byl úspěšně uložen',
  'saveSuccessMultiple': '<%= number %> bloků bylo úspěšně uloženo',
  'saveError': 'Při ukládání došlo k chybě<br /><%= error %>',
  // Tagging
  'Item tags': 'Štítky bloku',
  'Suggested tags': 'Navrhované štítky',
  'Tags': 'Štítky',
  'add a tag': 'Přidat štítek',
  // Collection widgets
  'Add': 'Přidat',
  'Choose type to add': 'Vyberte typ k přidání'
};
