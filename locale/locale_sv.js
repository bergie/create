if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.sv = {
  // Session-state buttons for the main toolbar
  'Save': 'Spara',
  'Saving': 'Sparar',
  'Cancel': 'Avbryt',
  'Edit': 'Redigera',
  // Storage status messages
  'localModification': 'Elementet "<%= label %>" har lokala förändringar',
  'localModifications': '<%= number %> element på den här sidan har lokala förändringar',
  'Restore': 'Återställ',
  'Ignore': 'Ignorera',
  'saveSuccess': 'Elementet "<%= label %>" sparades',
  'saveSuccessMultiple': '<%= number %> element sparades',
  'saveError': 'Ett fel uppstod under sparande<br /><%= error %>',
  // Tagging
  'Item tags': 'Element-taggar',
  'Suggested tags': 'Föreslagna taggar',
  'Tags': 'Taggar',
  'add a tag': 'lägg till en tagg',
  // Collection widgets
  'Add': 'Lägg till',
  'Choose type to add': 'Välj typ att lägga till'
};
