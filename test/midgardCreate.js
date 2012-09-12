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
  ok(fixture.data('midgardCreate'));
  ok(fixture.data('midgardNotifications'));
  ok(fixture.data('midgardWorkflows'));

  fixture.midgardCreate('destroy');

  // Check that all the widget instances have been cleaned up
  equal(fixture.data('midgardCreate'), undefined);
  equal(fixture.data('midgardNotifications'), undefined);
  equal(fixture.data('midgardWorkflows'), undefined);

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
