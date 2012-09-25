if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.bg = {
  // Session-state buttons for the main toolbar
  'Save': 'Запази',
  'Saving': 'Запазване',
  'Cancel': 'Откажи',
  'Edit': 'Редактирай',
  // Storage status messages
  'localModification': 'Елементът "<%= label %>" има локални модификации',
  'localModifications': '<%= number %> елемента на тази страница имат локални модификации',
  'Restore': 'Възстанови',
  'Ignore': 'Игнорирай',
  'saveSuccess': 'Елементът "<%= label %>" беше успешно запазен',
  'saveSuccessMultiple': '<%= number %> елемента бяха успешно запазени',
  'saveError': 'Възника грешка при запазване<br /><%= error %>',
  // Tagging
  'Item tags': 'Етикети на елемента',
  'Suggested tags': 'Препоръчани етикети',
  'Tags': 'Етикети',
  'add a tag': 'добави етикет',
  // Collection widgets
  'Add': 'Добави',
  'Choose type to add': 'Избери тип за добавяне'
};
