if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.ru = {
  // Session-state buttons for the main toolbar
  'Save': 'Сохранить',
  'Saving': 'Сохраняю',
  'Cancel': 'Отмена',
  'Edit': 'Редактировать',
  // Storage status messages
  'localModification': 'В запись "<%= label %>" внесены несохранённые изменения',
  'localModifications': 'В записи на этой странице (<%= number %> шт.) внесены несохранённые изменения',
  'Restore': 'Восстановить',
  'Ignore': 'Игнорировать',
  'saveSuccess': 'Запись "<%= label %>" была успешно сохранена',
  'saveSuccessMultiple': ' Записи (<%= number %> шт.) были успешно сохранены',
  'saveError': 'Во время сохранения произошла ошибка<br /><%= error %>',
  // Tagging
  'Item tags': 'Теги записей',
  'Suggested tags': 'Предлагаемые теги',
  'Tags': 'Теги',
  'add a tag': 'добавить тег',
  // Collection widgets
  'Add': 'Добавить',
  'Choose type to add': 'Выбрать тип для добавления'
};
