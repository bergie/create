module('midgardCreate');

test('Create widget registered', function () {
  equal(typeof jQuery('body').midgardCreate, 'function');
});

test('Create instantiation w/o VIE', function () {
  var fixture = jQuery('.create-instance');
  fixture.midgardCreate();
  var instance = fixture.data('midgardCreate');
  ok(instance);

  // Check some of the autoinitialization
  ok(instance.vie);
  ok(instance.vie.hasService('rdfa'));
});

test('Create instantiation and destruction', function () {
  var fixture = jQuery('.create-instance-destroy');
  fixture.midgardCreate();

  // Check that all Create.js widgets have been instantiated
  ok(fixture.data('midgardCreate'), 'Create instance');
  ok(fixture.data('midgardNotifications'), 'Notifications instance');
  ok(fixture.data('midgardWorkflows'), 'Workflows instance');
  ok(fixture.data('midgardToolbar'), 'Toolbar instance');
  ok(fixture.data('midgardStorage'), 'Storage instance');

  jQuery('[about]', fixture).each(function () {
    ok(jQuery(this).data('midgardEditable'), 'Editable instance');
  });

  fixture.midgardCreate('destroy');

  // Check that all the widget instances have been cleaned up
  equal(fixture.data('midgardCreate'), undefined);
  equal(fixture.data('midgardNotifications'), undefined);
  equal(fixture.data('midgardWorkflows'), undefined);
  equal(fixture.data('midgardToolbar'), undefined);
  equal(fixture.data('midgardStorage'), undefined);

  jQuery('[about]', fixture).each(function () {
    equal(jQuery(this).data('midgardEditable'), undefined);
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

  var instance = fixture.data('midgardCreate');
  ok(instance);

  // Check that Create uses *our* VIE
  ok(instance.vie);
  equal(instance.vie, v);
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
  expect(12);
  var fixture = jQuery('.create-edit-events');

  fixture.bind('midgardcreatestatechange', function (event, data) {
    ok(data.state);
    equal(data.state, 'edit');
  });

  fixture.bind('midgardeditableenable', function (event, data) {
    ok(data.instance);
    ok(data.entityElement);
  });

  // We have two properties, so this will be called twice
  fixture.bind('midgardeditableenableproperty', function (event, data) {
    ok(data.property);
    ok(data.instance);
    ok(data.element);
    ok(data.entityElement);
  });

  fixture.midgardCreate({
    state: 'edit'
  });
});

test('Create state change events', function () {
  expect(20);
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
    ok(data.instance, 'enabled editables provide entity instance');
    ok(data.entityElement, 'enabled editables provide the entity element');
  });

  // Will be called twice, initially and then when returning to browse state
  fixture.bind('midgardeditabledisable', function (event, data) {
    ok(data.instance, 'disabled editables provide entity instance');
    ok(data.entityElement, 'disabled editables provide the entity element');
  });

  // We have two properties, so this will be called twice
  fixture.bind('midgardeditableenableproperty', function (event, data) {
    ok(data.property, 'enabled properties have property name');
    ok(data.instance, 'enabled properties have entity instance');
    ok(data.element, 'enabled properties have property element');
    ok(data.entityElement, 'enabled properties have entity element');
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
