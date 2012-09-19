if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.es = {
  // Session-state buttons for the main toolbar
  'Save': 'Guardar',
  'Saving': 'Guardando',
  'Cancel': 'Cancelar',
  'Edit': 'Editar',
  // Storage status messages
  'localModification': 'El elemento "<%= label %>" tiene modificaciones locales',
  'localModifications': '<%= number %> elementos en la página tienen modificaciones locales',
  'Restore': 'Restaurar',
  'Ignore': 'Ignorar',
  'saveSuccess': 'El elemento "<%= label %>" se guardó exitosamente',
  'saveSuccessMultiple': '<%= number %> elementos se guardaron exitosamente',
  'saveError': 'Ha ocurrido un error cuando se guardaban los datos<br /><%= error %>',
  // Tagging
  'Item tags': 'Etiquetas de los elementos',
  'Suggested tags': 'Etiquetas sugeridas',
  'Tags': 'Etiquetas',
  'add a tag': 'añadir una etiqueta',
  // Collection widgets
  'Add': 'Añadir',
  'Choose type to add': 'Escoge el tipo a añadir'
};
