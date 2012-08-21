jQuery(document).ready(function() {
  // Instantiate Create
  jQuery('body').midgardCreate({
    url: function() {
      return 'javascript:false;';
    },
    stanbolUrl: 'http://dev.iks-project.eu:8081',
    collectionWidgets: {
      'default': null,
      'feature': 'midgardCollectionAdd'
    }
  });
  
  // Fake Backbone.sync since there is no server to communicate with
  Backbone.sync = function(method, model, options) {
    if (console && console.log) {
      console.log('Model contents', model.toJSONLD());
    }
    options.success(model);
  };
});
