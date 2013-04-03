module('midgardCreate');

test('Create widget registered', function () {
  equal(typeof jQuery('body').midgardCreate, 'function');
});

test('Create instantiation w/o VIE', function () {
  var fixture = jQuery('.create-instance');
  fixture.midgardCreate();
  var instance = fixture.data('Midgard-midgardCreate');
  ok(instance);

  // Check some of the autoinitialization
  ok(instance.vie);
  ok(instance.vie.hasService('rdfa'));
});

test('Create instantiation and destruction', function () {
  var fixture = jQuery('.create-instance-destroy');
  fixture.midgardCreate();

  // Check that all Create.js widgets have been instantiated
  ok(fixture.data('Midgard-midgardCreate'), 'Create instance');
  ok(fixture.data('Midgard-midgardNotifications'), 'Notifications instance');
  ok(fixture.data('Midgard-midgardWorkflows'), 'Workflows instance');
  ok(fixture.data('Midgard-midgardToolbar'), 'Toolbar instance');
  ok(fixture.data('Midgard-midgardStorage'), 'Storage instance');

  jQuery('[about]', fixture).each(function () {
    ok(jQuery(this).data('Midgard-midgardEditable'), 'Editable instance');
  });

  fixture.midgardCreate('destroy');

  // Check that all the widget instances have been cleaned up
  equal(fixture.data('Midgard-midgardCreate'), undefined);
  equal(fixture.data('Midgard-midgardNotifications'), undefined);
  equal(fixture.data('Midgard-midgardWorkflows'), undefined);
  equal(fixture.data('Midgard-midgardToolbar'), undefined);
  equal(fixture.data('Midgard-midgardStorage'), undefined);

  jQuery('[about]', fixture).each(function () {
    equal(jQuery(this).data('Midgard-midgardEditable'), undefined);
  });

  /*
   * TODO: enable when jQuery UI 1.9 is out
  throws(function () {
    fixture.midgardCreate('configureEditor', 'aloha', 'alohaWidget', {});
  }, 'Throws exception because midgardCreate instance has been destroyed');
  */
});

test('Create instantiation with VIE', function () {
  var v = new VIE();
  var fixture = jQuery('.create-instance-vie');
  fixture.midgardCreate({
    vie: v
  });

  var instance = fixture.data('Midgard-midgardCreate');
  ok(instance);

  // Check that Create uses *our* VIE
  ok(instance.vie);
  equal(instance.vie, v);

  // Check that VIE's DOM parsing service supplies the methods we need
  ok(instance.domService);
  ok(v.hasService(instance.options.domService));
  equal(instance.domService, v.service(instance.options.domService));
  ok(_.isFunction(instance.domService.findSubjectElements));
});

test('Create URL callback registration', function () {
  expect(3);
  var fixture = jQuery('.create-url-callback');

  fixture.bind('midgardeditableenable', function (event, data) {
    ok(data.instance);
    ok(data.entityElement);
    equal(data.instance.url(), 'foo');
  });

  fixture.midgardCreate({
    url: function () { return 'foo'; },
    state: 'edit'
  });
});

test('Create edit events', function () {
  expect(27);
  var fixture = jQuery('.create-edit-events');

  fixture.bind('midgardcreatestatechange', function (event, data) {
    ok(data.state);
    equal(data.state, 'edit');
  });

  fixture.bind('midgardeditableenable', function (event, data) {
    // Ensure backwards compatibility.
    ok(data.instance);
    ok(data.entityElement);

    ok(data.entity, 'enabled properties have the Backbone model instance for the entity');
    ok(data.editableEntity, 'enabled properties have the EditableEntity widget object for the entity');
    ok(data.entityElement, 'enabled properties have the DOM element for the entity');
  });

  // We have two properties, so this will be called twice
  fixture.bind('midgardeditableenableproperty', function (event, data) {
    // Ensure backwards compatibility.
    ok(data.predicate);
    ok(data.instance);
    ok(data.element);
    ok(data.entityElement);

    ok(data.entity, 'enabled properties have the Backbone model instance for the entity');
    ok(data.editableEntity, 'enabled properties have the EditableEntity widget object for the entity');
    ok(data.entityElement, 'enabled properties have the DOM element for the entity');
    ok(data.predicate, 'enabled properties have the predicate of the property');
    ok(data.propertyEditor, 'enabled properties have the property editor for the property');
    ok(data.propertyElement, 'enabled properties have the DOM element for the property');
  });

  fixture.midgardCreate({
    state: 'edit'
  });
});

test('Create state change events', function () {
  expect(41);
  var fixture = jQuery('.create-state-events');

  var previous = null;
  fixture.bind('midgardcreatestatechange', function (event, data) {
    ok(data.state, 'State change events provide a state value');
    if (previous === 'browse') {
      equal(data.state, 'edit', 'from browse we go to edit state');
      previous = 'edit';
    } else {
      equal(data.state, 'browse', 'from edit we got to browse state');
      previous = 'browse';
    }
  });

  // Will be called once, when we go to edit state
  fixture.bind('midgardeditableenable', function (event, data) {
    // Ensure backwards compatibility.
    ok(data.instance, 'enabled editables provide entity instance');
    ok(data.entityElement, 'enabled editables provide the entity element');

    ok(data.entity, 'enabled properties have the Backbone model instance for the entity');
    ok(data.editableEntity, 'enabled properties have the EditableEntity widget object for the entity');
    ok(data.entityElement, 'enabled properties have the DOM element for the entity');
  });

  // Will be called twice, initially and then when returning to browse state
  fixture.bind('midgardeditabledisable', function (event, data) {
    // Ensure backwards compatibility.
    ok(data.instance, 'disabled editables provide entity instance');
    ok(data.entityElement, 'disabled editables provide the entity element');

    ok(data.entity, 'enabled properties have the Backbone model instance for the entity');
    ok(data.editableEntity, 'enabled properties have the EditableEntity widget object for the entity');
    ok(data.entityElement, 'enabled properties have the DOM element for the entity');
  });

  // We have two properties, so this will be called twice
  fixture.bind('midgardeditableenableproperty', function (event, data) {
    // Ensure backwards compatibility.
    ok(data.property, 'enabled properties have property name');
    ok(data.instance, 'enabled properties have entity instance');
    ok(data.element, 'enabled properties have property element');
    ok(data.entityElement, 'enabled properties have entity element');

    ok(data.entity, 'enabled properties have the Backbone model instance for the entity');
    ok(data.editableEntity, 'enabled properties have the EditableEntity widget object for the entity');
    ok(data.entityElement, 'enabled properties have the DOM element for the entity');
    ok(data.predicate, 'enabled properties have the predicate of the property');
    ok(data.propertyEditor, 'enabled properties have the property editor for the property');
    ok(data.propertyElement, 'enabled properties have the DOM element for the property');
  });

  // Start in browse state
  fixture.midgardCreate();
  // Enter edit state
  fixture.midgardCreate('setState', 'edit');
  // Return to browse state
  fixture.midgardCreate('setState', 'browse');
});

test('Create toolbar minimize / maximize', function () {
  var fixture = jQuery('.create-toolbar-state');
  fixture.midgardCreate();

  // Initially the full toolbar should be shown
  equal(jQuery('div.create-ui-toolbar-wrapper:visible', fixture).length, 1);
  equal(jQuery('div.create-ui-logo:visible', fixture).length, 1);

  var previous = 'full';
  fixture.bind('midgardtoolbarstatechange', function (event, data) {
    ok(data.display, 'toolbar change events should communicate display state');
    if (previous === 'full') {
      equal(data.display, 'minimized', 'after full the toolbar should get minimized');
      previous = 'minimized';
    } else {
      equal(data.display, 'full', 'after minimized the toolbar should be maximized');
      previous = 'full';
    }
    start();
  });

  // Click the Logo to minimize
  stop(2);
  jQuery('div.create-ui-logo a.create-ui-toggle', fixture).click();

  setTimeout(function () {
    equal(jQuery('div.create-ui-toolbar-wrapper:visible', fixture).length, 0, 'after minimization there should be no visible toolbars');
    equal(jQuery('div.create-ui-toolbar-wrapper:hidden', fixture).length, 1, 'after minimization there should be no visible toolbars');
    equal(jQuery('div.create-ui-logo:visible', fixture).length, 1, 'Create.js logo should remain visible');
    start();

    // Click the Logo to maximize again
    stop(2);
    jQuery('div.create-ui-logo a.create-ui-toggle', fixture).click();

    setTimeout(function () {
      equal(jQuery('div.create-ui-toolbar-wrapper:hidden', fixture).length, 0);
      equal(jQuery('div.create-ui-toolbar-wrapper:visible', fixture).length, 1);
      equal(jQuery('div.create-ui-logo:visible', fixture).length, 1, 'Create.js logo should remain visible');
      start();
    }, 500);
  }, 500);
});
