/*
//     Create.js - On-site web editing interface
//     (c) 2012 Tobias Herrmann, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
*/
(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false document:false CKEDITOR:false */
  'use strict';

  // # CKEditor editing widget
  //
  // This widget allows editing textual content areas with the
  // [CKEditor](http://ckeditor.com/) rich text editor.
  jQuery.widget('Midgard.ckeditorWidget', jQuery.Midgard.editWidget, {
    options: {
      editorOptions: {},
      disabled: true,
      vie: null
    },
    enable: function () {
      this.element.attr('contentEditable', 'true');
      this.editor = CKEDITOR.inline(this.element.get(0));
      this.options.disabled = false;

      var widget = this;
      this.editor.on('focus', function () {
        widget.options.activated();
      });
      this.editor.on('blur', function () {
        widget.options.activated();
        widget.options.changed(widget.editor.getData());
      });
      this.editor.on('change', function () {
        widget.options.changed(widget.editor.getData());
      });
      this.editor.on('configLoaded', function() {
        jQuery.each(widget.options.editorOptions, function(optionName, option) {
          widget.editor.config[optionName] = option;
        });
      });
    },

    disable: function () {
      if (!this.editor) {
        return;
      }
      this.element.attr('contentEditable', 'false');
      this.editor.destroy();
      this.editor = null;
    },

    _initialize: function () {
      CKEDITOR.disableAutoInline = true;
    }
  });
})(jQuery);
