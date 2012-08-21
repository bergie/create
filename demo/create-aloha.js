jQuery(document).ready(function() {
  // Instantiate Create
  jQuery('body').midgardCreate({
    url: function() {
      return 'javascript:false;';
    },
    // Use Aloha for all text editing
    editorWidgets: {
      'default': 'aloha'
    },
    editorOptions: {
      aloha: {
        widget: 'alohaWidget'
      }
    },
    collectionWidgets: {
      'default': null,
      'feature': 'midgardCollectionAdd'
    },
    stanbolUrl: 'http://dev.iks-project.eu:8081' 
  });
  
  // Fake Backbone.sync since there is no server to communicate with
  Backbone.sync = function(method, model, options) {
    if (console && console.log) {
      console.log('Model contents', model.toJSONLD());
    }
    options.success(model);
  };
});
