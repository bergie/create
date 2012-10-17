if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.he = {
  // Session-state buttons for the main toolbar
  'Save': 'שמור',
  'Saving': 'שומר',
  'Cancel': 'בטל',
  'Edit': 'ערוך',
  // Storage status messages
  'localModification': 'לפריט "<%= label %>" שינויים מקומיים',
  'localModifications': 'ל<%= number %> פריטים בדף זה שינויים מקומיים',
  'Restore': 'שחזר',
  'Ignore': 'התעלם',
  'saveSuccess': 'פריט "<%= label %>" נשמר בהצלחה',
  'saveSuccessMultiple': '<%= number %> פריטים נשמרו בהצלחה',
  'saveError': 'שגיאה בשמירה<br /><%= error %>',
  // Tagging
  'Item tags': 'סיווגי פריט',
  'Suggested tags': 'סיווגים מומלצים',
  'Tags': 'סיווגים',
  'add a tag': 'הוסף סיווג',
  // Collection widgets
  'Add': 'הוסף',
  'Choose type to add': 'בחר סוג להוספה'
};
