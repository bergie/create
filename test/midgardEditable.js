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
  var fixture = jQuery('#qunit-fixture .edit-add');
  var v = new VIE();
  v.use(new v.RdfaService());
  v.entities.on('add', function (entity) {
    entity.url = function () { return entity.getSubjectUri(); };
  });

  var enabled = 0;
  var checkEnabled = function(event, options) {
    enabled++;
    equal(options.property, 'dcterms:title');

    if (options.instance.isNew()) {
      equal(options.instance.get('@type').id, '<http://www.w3.org/2002/07/owl#Thing>');
    }
  };
  fixture.bind('midgardeditableenableproperty', checkEnabled);

  v.service('rdfa').findSubjectElements(fixture).each(function () {
    jQuery(this).midgardEditable({
      disabled: false,
      vie: v
    });
  });

  stop();
  jQuery('.midgard-create-add', fixture).click();

  setTimeout(function() {
     if (enabled < 2) {
       return;
     }
     start();
  }, 500);
});

test('Editable collection with type', function() {
  var fixture = jQuery('#qunit-fixture .edit-add-typed');
  var v = new VIE();
  v.use(new v.RdfaService());
  v.entities.on('add', function (entity) {
    entity.url = function () { return entity.getSubjectUri(); };
  });
  v.service('rdfa').findSubjectElements(fixture).each(function () {
    jQuery(this).midgardEditable({
      disabled: false,
      vie: v
    });
  });

  fixture.bind('midgardeditableenable', function(event, options) {
    ok(options.instance.isNew());
    equal(options.instance.get('@type').id, '<http://rdfs.org/sioc/ns#Post>');
    start();
  });

  jQuery('.midgard-create-add', fixture).click();
  stop();
});
