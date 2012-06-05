//     Create.js - On-site web editing interface
//     (c) 2012 Tobias Herrmann, IKS Consortium
//     (c) 2011 Rene Kapusta, Evo42
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  // # Aloha editing widget
  //
  // This widget allows editing textual contents using the
  // [Aloha](http://aloha-editor.org) rich text editor.
  //
  // Due to licensing incompatibilities, Aloha Editor needs to be installed
  // and configured separately.
  jQuery.widget('Create.alohaWidget', jQuery.Create.editWidget, {
    enable: function () {
      this._initialize();
      this.options.disabled = false;
    },
    disable: function () {
      try {
        options.editable.destroy();
      } catch (err) {}
      this.options.disabled = true;
    },
    _initialize: function () {
      var options = this.options;
      var editable = new Aloha.Editable(Aloha.jQuery(options.element.get(0)));
      editable.vieEntity = options.entity;

      // Subscribe to activation and deactivation events
      Aloha.bind('aloha-editable-activated', function () {
        options.activated();
      });
      Aloha.bind('aloha-editable-deactivated', function () {
        options.deactivated();
      });

      Aloha.bind('aloha-smart-content-changed', function () {
        if (!editable.isModified()) {
          return true;
        }
        options.modified(editable.getContents());
        editable.setUnmodified();
      });
    }
  });
})(jQuery);
