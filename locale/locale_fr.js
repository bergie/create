if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.fr = {
  // Session-state buttons for the main toolbar
  'Save': 'Enregistrer',
  'Saving': 'Enregistrement en cours',
  'Cancel': 'Annuler',
  'Edit': 'Éditer',
  // Storage status messages
  'localModification': 'L\'élément "<%= label %>" comporte des modifications locales',
  'localModifications': '<%= number %> éléments sur cette page comportent des modifications locales',
  'Restore': 'Restaurer',
  'Ignore': 'Ignorer',
  'saveSuccess': 'L\'élément "<%= label %>" a été enregistré avec succès',
  'saveSuccessMultiple': '<%= number %> éléments ont été enregistrés avec succès',
  'saveError': 'Une erreur est survenue durant l\'enregistrement<br /><%= error %>',
  // Tagging
  'Item tags': 'Tags des éléments',
  'Suggested tags': 'Tags suggérés',
  'Tags': 'Tags',
  'add a tag': 'ajouter un tag',
  // Collection widgets
  'Add': 'Ajouter',
  'Choose type to add': 'Choisir le type à ajouter'
};
