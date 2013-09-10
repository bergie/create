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

  var instance = fixture.data('Midgard-midgardEditable');
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

test('Editable state change', function () {
  var fixture = jQuery('.edit-states');

  var v = new VIE();
  v.use(new v.RdfaService());

  fixture.midgardEditable({
    vie: v,
    disabled: true
  });

  var instance = fixture.data('Midgard-midgardEditable');
  ok(instance);

  equal(instance.getState(), 'inactive');

  stop();
  fixture.one('midgardeditablestatechange', function (event, data) {
    // Check state change values
    ok(data.current);
    equal(data.current, 'candidate');
    ok(data.previous);
    equal(data.previous, 'inactive');
    equal(data.predicate, null);

    // Check context
    ok(data.context);
    ok(data.context.foo);
    equal(data.context.foo, 'bar');

    // Check regular event params
    ok(data.entity);
    equal(data.entity.getSubjectUri(), 'states');
    ok(data.editableEntity);
    equal(data.editableEntity, instance);
    ok(data.entityElement);
    equal(data.entityElement.get(0), fixture.get(0));

    // Check deprecated event params
    ok(data.editable);
    equal(data.editable, data.editableEntity);
    ok(data.element);
    equal(data.element, data.entityElement);
    ok(data.instance);
    equal(data.instance, data.entity);
    start();
  });
  fixture.midgardEditable('setState', 'candidate', null, {
    foo: 'bar'
  });
});

test('Editable decorators', function () {
  var fixture = jQuery('.edit-decorators');

  var v = new VIE();
  v.use(new v.RdfaService());

  stop(3);

  var entityDecorator = function (data) {
    ok(data);
    ok(data.entity);
    equal(data.entity.getSubjectUri(), 'decorators');
    ok(data.editableEntity);
    ok(data.entityElement);
    equal(data.entityElement.get(0), fixture.get(0));
    start();
  };

  var propertyDecorator = function (data) {
    ok(data);
    ok(data.predicate);
    equal(data.predicate, 'dcterms:title');
    ok(data.propertyEditor);
    ok(data.propertyElement);
    equal(data.propertyElement.get(0), jQuery('[property]', fixture).get(0));
    start();
  };

  fixture.midgardEditable({
    vie: v,
    decorateEditableEntity: entityDecorator,
    decoratePropertyEditor: propertyDecorator
  });

  fixture.one('midgardeditablestatechange', function (event, data) {
    ok(data.entity);
    ok(data.current);
    equal(data.current, 'active');
    ok(data.previous);
    equal(data.previous, 'candidate');
    ok(data.predicate);
    equal(data.predicate, 'dcterms:title');
    start();
  });

  window.setTimeout(function () {
    jQuery('[property]', fixture).focus();
  }, 20);
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

test('Editable collection edit/cancel', function() {
  var fixture = jQuery('#qunit-fixture .edit-edit-cancel');
  var v = new VIE();
  v.use(new v.RdfaService());
  v.entities.on('add', function (entity) {
    entity.url = function () { return entity.getSubjectUri(); };
  });

  var enabled = 0;
  fixture.bind('midgardeditableenable', function(event, options) {
    enabled++;
    if (enabled < 2) {
      return;
    }
    equal(jQuery('[contenteditable="true"]', fixture).length, 1);
    start();
    v.service('rdfa').findSubjectElements(fixture).each(function () {
      jQuery(this).midgardEditable({
        disabled: true
      });
    });
  });

  var disabled = 0;
  fixture.bind('midgardeditabledisable', function(event, options) {
    disabled++;
    if (disabled < 2) {
      return;
    }
    start();
    equal(jQuery('[contenteditable="true"]', fixture).length, 0);
  });

  stop(2);
  v.service('rdfa').findSubjectElements(fixture).each(function () {
    jQuery(this).midgardEditable({
      disabled: false,
      vie: v
    });
  });
});

test('Editable collection edit/add/cancel', function() {
  var fixture = jQuery('#qunit-fixture .edit-add-edit-cancel');
  var v = new VIE();
  v.use(new v.RdfaService());
  v.entities.on('add', function (entity) {
    entity.url = function () { return entity.getSubjectUri(); };
  });

  equal(jQuery('[contenteditable="true"]', fixture).length, 0);
  v.service('rdfa').findSubjectElements(fixture).each(function () {
    jQuery(this).midgardEditable({
      disabled: false,
      vie: v
    });
  });
  equal(jQuery('[contenteditable="true"]', fixture).length, 1);

  fixture.bind('midgardeditableenable', function(event, options) {
    ok(options.instance.isNew());
    equal(options.instance.has('dcterms:title'), false);
    equal(jQuery('[contenteditable="true"]', fixture).length, 2);
    start();
    v.service('rdfa').findSubjectElements(fixture).each(function () {
      jQuery(this).midgardEditable({
        disabled: true
      });
    });
  });

  var disabled = 0;
  fixture.bind('midgardeditabledisable', function(event, options) {
    disabled++;
    if (disabled < 3) {
      return;
    }
    start();
    equal(jQuery('[contenteditable="true"]', fixture).length, 0);
  });

  jQuery('.midgard-create-add', fixture).click();
  stop(2);
});
