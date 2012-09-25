module('midgardEditable');

test('Editable widget', function() {
  equal(typeof jQuery('body').midgardEditable, 'function');
});

test('Editable instance', function () {
  var fixture = jQuery('.edit-instance');

  var v = new VIE();
  v.use(new v.RdfaService());

  fixture.midgardEditable({
    vie: v
  });

  var instance = fixture.data('midgardEditable');
  ok(instance);

  // Check VIE
  ok(instance.vie);
  equal(instance.vie, v);
  ok(instance.domService);
  equal(instance.domService, v.service(instance.options.domService));
  ok(_.isFunction(instance.domService.findPredicateElements));
  ok(_.isFunction(instance.domService.getElementPredicate));
  ok(_.isArray(instance.domService.views)); 
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
