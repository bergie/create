if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.it = {
  // Session-state buttons for the main toolbar
  'Save': 'Salva',
  'Saving': 'Salvataggio',
  'Cancel': 'Esci',
  'Edit': 'Modifica',
  // Storage status messages
  'localModification': 'Articolo "<%= label %>" in questa pagina hanno modifiche locali',
  'localModifications': '<%= number %> articoli in questa pagina hanno modifiche locali',
  'Restore': 'Ripristina',
  'Ignore': 'Ignora',
  'saveSuccess': 'Articolo "<%= label %>" salvato con successo',
  'saveSuccessMultiple': '<%= number %> articoli salvati con successo',
  'saveError': 'Errore durante il salvataggio<br /><%= error %>',
  // Tagging
  'Item tags': 'Tags articolo',
  'Suggested tags': 'Tags suggerite',
  'Tags': 'Tags',
  'add a tag': 'Aggiungi una parola chiave',
  // Collection widgets
  'Add': 'Aggiungi',
  'Choose type to add': 'Scegli il tipo da aggiungere'
};
