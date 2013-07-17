/*
//     Create.js - On-site web editing interface
//     (c) 2012 Tobias Herrmann, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
*/
(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false document:false tinymce:false */
  'use strict';

  // # TinyMCE editing widget
  //
  // This widget allows editing textual content areas with the
  // [TinyMCE](http://www.tinymce.com/) rich text editor.
  jQuery.widget('Midgard.tinymceWidget', jQuery.Midgard.editWidget, {
    enable: function () {
      this.element.attr('contentEditable', 'true');
      var id = this.element.attr('id');

      if (!id || tinymce.get(id)) {
        id = tinymce.DOM.uniqueId();
      }

      this.element.attr('id', id);
      this.editor = new tinymce.Editor(id, {inline: true}, tinymce.EditorManager);
      this.editor.render(true);
      this.options.disabled = false;

      var widget = this;
      this.editor.on('focus', function () {
        widget.options.activated();
      });
      this.editor.on('blur', function () {
        widget.options.activated();
        widget.options.changed(widget.editor.getContent());
      });
      this.editor.on('change', function () {
        widget.options.changed(widget.editor.getContent());
      });
    },

    disable: function () {
      if (!this.editor) {
        return;
      }
      this.element.attr('contentEditable', 'false');
      this.editor.remove();
      this.editor = null;
    }
  });
})(jQuery);
