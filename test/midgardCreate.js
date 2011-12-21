module('midgardCreate');

test('Create widget', function() {
  equal(typeof jQuery('body').midgardCreate, 'function');
});

test('Toolbar state', function() {
  jQuery('#qunit-fixture .toolbar-state').midgardCreate({
    storagePrefix: 'toolbar-state'
  });
  equal(jQuery('#midgard-bar').length, 1);
  ok(jQuery('#midgard-bar').css('display') !== 'none');
  equal(jQuery('#midgard-bar-minimized').css('display'), 'none');


  jQuery('#midgard-bar-hidebutton').click();
  equal(jQuery('#midgard-bar-minimized').length, 1);
  stop();
  setTimeout(function() {
    equal(jQuery('#midgard-bar').css('display'), 'none');
    ok(jQuery('#midgard-bar-minimized').css('display') !== 'none');
    jQuery('#qunit-fixture .toolbar-state').empty();
    start();
  }, 1500);
});

test('Toolbar edit', function() {
  jQuery('#qunit-fixture .toolbar-edit').midgardCreate({
    storagePrefix: 'toolbar-edit'
  });

  var checkEdit = function(event, options) {
    equal(options.state, 'edit');
    start();
    jQuery('#qunit-fixture .toolbar-edit').unbind('midgardcreatestatechange', checkEdit);
  };

  var checkBrowse = function(event, options) {
    equal(options.state, 'browse');
    start();
    jQuery('#qunit-fixture .toolbar-edit').unbind('midgardcreatestatechange', checkBrowse);
  };

  stop();
  jQuery('#qunit-fixture .toolbar-edit').bind('midgardcreatestatechange', checkEdit);
  jQuery('#qunit-fixture .toolbar-edit #midgard-bar #midgardcreate-edit').click();

  stop();
  jQuery('#qunit-fixture .toolbar-edit').bind('midgardcreatestatechange', checkBrowse);
  jQuery('#qunit-fixture .toolbar-edit #midgard-bar #midgardcreate-edit').click();
});
