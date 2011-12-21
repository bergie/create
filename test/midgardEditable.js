module('midgardEditable');
test('Editable widget', function() {
  equal(typeof jQuery('body').midgardEditable, 'function');
});

test('Editable collection', function() {
  jQuery('#qunit-fixture .edit-add').midgardCreate({
    storagePrefix: 'editable-collection',
    highlight: false
  });

  var enabled = 0;
  var checkEnabled = function(event, options) {
    equal(options.property, 'dcterms:title');
    enabled++;
    start();
  };

  equal(jQuery('#qunit-fixture .edit-add #midgard-bar #midgardcreate-edit').attr('checked') !== true, true);

  jQuery('#qunit-fixture .edit-add').bind('midgardeditableenableproperty', checkEnabled);
  stop();
  jQuery('#qunit-fixture .edit-add #midgard-bar #midgardcreate-edit').click();
  jQuery('#qunit-fixture .edit-add .midgard-create-add').click();

  setTimeout(function() {
     if (enabled >= 2) {
       return;
     }
     start();
  }, 400);
});
