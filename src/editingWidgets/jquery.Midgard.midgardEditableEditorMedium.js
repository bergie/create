/*
//     Create.js - On-site web editing interface
//     (c) 2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
*/
(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false document:false */
  'use strict';

  // # Medium Editor editing widget
  //
  // This widget allows editing textual content areas with the
  // [Medium Editor](https://github.com/daviferreira/medium-editor) rich text editor.
  jQuery.widget('Midgard.mediumWidget', jQuery.Midgard.editWidget, {
    editor: null,
    listener: null,

    options: {
      editorOptions: {},
      disabled: true
    },

    enable: function () {
      this.editor = new MediumEditor(this._buildSelector(), this.editorOptions);
      this.listener = function () {
        this.options.changed(jQuery(this.element).text());
      }.bind(this);

      jQuery(this.element).on('keyup', this.listener);
      // TODO: Change events, see https://github.com/daviferreira/medium-editor/issues/17
    },

    disable: function () {
      jQuery(this.element).off('keyup', this.listener);
      // TODO: Close the editor, see https://github.com/daviferreira/medium-editor/issues/19
    },

    _buildSelector: function () {
      var aboutSelector = '[about="' + this.options.entity.getSubjectUri() + '"]';
      var propertySelector = '[property="' + this.options.property + '"]';
      return aboutSelector + ' ' + propertySelector;
    }
  });
})(jQuery);
