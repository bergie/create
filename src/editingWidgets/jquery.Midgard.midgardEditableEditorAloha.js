/*
//     Create.js - On-site web editing interface
//     (c) 2012 Tobias Herrmann, IKS Consortium
//     (c) 2011 Rene Kapusta, Evo42
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
*/
(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false document:false Aloha:false */
  'use strict';

  // # Aloha editing widget
  //
  // This widget allows editing textual contents using the
  // [Aloha](http://aloha-editor.org) rich text editor.
  //
  // Due to licensing incompatibilities, Aloha Editor needs to be installed
  // and configured separately.
  jQuery.widget('Midgard.alohaWidget', jQuery.Midgard.editWidget, {
    _initialize: function () {},
    enable: function () {
      var options = this.options;
      var editable;
      var currentElement = Aloha.jQuery(options.element.get(0)).aloha();
      _.each(Aloha.editables, function (aloha) {
        // Find the actual editable instance so we can hook to the events
        // correctly
        if (aloha.obj.get(0) === currentElement.get(0)) {
          editable = aloha;
        }
      });
      if (!editable) {
        return;
      }
      editable.vieEntity = options.entity;

      var checkEditableChanged;

      function activeEditableChanged() {
        if (Aloha.activeEditable.isModified()) {
          options.changed(Aloha.activeEditable.getContents());
          Aloha.activeEditable.setUnmodified();
        }
      }

      // Subscribe to activation and deactivation events
      Aloha.bind('aloha-editable-activated', function (event, data) {
        if (data.editable !== editable) {
          return;
        }
        checkEditableChanged = window.setInterval(activeEditableChanged, 500);
        options.activated();
      });
      Aloha.bind('aloha-editable-deactivated', function (event, data) {
        if (data.editable !== editable) {
          return;
        }
        window.clearInterval(checkEditableChanged);
        options.deactivated();
      });

      Aloha.bind('aloha-smart-content-changed', function (event, data) {
        if (data.editable !== editable) {
          return;
        }
        if (!data.editable.isModified()) {
          return true;
        }
        options.changed(data.editable.getContents());
        data.editable.setUnmodified();
      });
      this.options.disabled = false;
    },
    disable: function () {
      Aloha.jQuery(this.options.element.get(0)).mahalo();
      this.options.disabled = true;
    }
  });
})(jQuery);
