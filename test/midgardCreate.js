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

test('Create instantiation with VIE', function () {
  var v = new VIE();
  var fixture = jQuery('.create-instance');
  fixture.midgardCreate({
    vie: v
  });

  var instance = fixture.data('midgardCreate');
  ok(instance);

  // Check that Create uses *our* VIE
  ok(instance.vie);
  equal(instance.vie, v);
});
