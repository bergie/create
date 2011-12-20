module('midgardCreate');

test('Create widget', function() {
  equal(typeof jQuery('body').midgardCreate, 'function');
});

test('Toolbar state', function() {
  jQuery('body').midgardCreate();
  equal(jQuery('#midgard-bar').length, 1);
  equal(jQuery('#midgard-bar').css('display'), 'block');
  equal(jQuery('#midgard-bar-minimized').css('display'), 'none');


  jQuery('#midgard-bar-hidebutton').click();
  equal(jQuery('#midgard-bar-minimized').length, 1);
  stop();
  setTimeout(function() {
    equal(jQuery('#midgard-bar').css('display'), 'none');
    equal(jQuery('#midgard-bar-minimized').css('display'), 'block');
    start();
  }, 2000);
});
