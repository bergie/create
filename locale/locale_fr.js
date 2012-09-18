if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.fr = {
  // Session-state buttons for the main toolbar
  'Save': 'Sauver',
  'Saving': 'En cours',
  'Cancel': 'Annuler',
  'Edit': 'Editer',
  // Storage status messages
  'localModifications': '<%= number %> élements sur cette page ont des modifications locales',
  'Restore': 'Récupérer',
  'Ignore': 'Ignorer',
  'saveSuccess': '"<%= label %>" est sauvegardé avec succès',
  'saveSuccessMultiple': '<%= number %> éléments ont été sauvegardé avec succès',
  'saveError': 'Une erreur est survenue durant la sauvegarde:<br /><%= error %>',
  // Tagging
  'Item tags': 'Tags des objets',
  'Suggested tags': 'Tags suggérés',
  'Tags': 'Tags',
  'add a tag': 'ajouter un tag',
  // Collection widgets
  'Add': 'Ajouter',
  'Choose type to add': 'Choisir le type à ajouter'
};
