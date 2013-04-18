/*
//     Create.js - On-site web editing interface
//     (c) 2012 IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
*/
(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false */
  'use strict';

  jQuery.widget('Midgard.midgardMetadata', {
    contentArea: null,
    editorElements: {},
    options: {
      vie: null,
      templates: {
        button: '<button class="create-ui-btn"><i class="icon-<%= icon %>"></i> <%= label %></button>',
        contentArea: '<div class="dropdown-menu"></div>'
      },
      localize: function (id, language) {
        return window.midgardCreate.localize(id, language);
      },
      language: null,
      createElement: 'body',
      editableNs: 'midgardeditable'
    },

    _create: function () {
      this._render();
    },

    _init: function () {
      this._prepareEditors();
      this._bindEditables();
    },

    _prepareEditors: function () {
      _.each(this.options.editors, function (configuration, editor) {
        // We need to create containers for each editor and instantiate them
        var editorArea = jQuery('<div></div>').addClass(editor);
        this.contentArea.append(editorArea);
        if (!_.isFunction(editorArea[editor])) {
          throw new Error('Metadata editor widget ' + editor + ' is not available');
        }

        _.extend(configuration, {
          vie: this.options.vie,
          language: this.options.language,
          localize: this.options.localize,
          createElement: this.options.createElement,
          editableNs: this.options.editableNs
        });

        editorArea[editor](configuration);
        this.editorElements[editor] = editorArea;
      }, this);
    },

    activateEditors: function (data) {
      this.element.show();
      _.each(this.options.editors, function (configuration, editor) {
        if (!this.editorElements[editor]) {
          return;
        }
        // An editable has been activated, pass the info on to the
        // editor widgets
        this.editorElements[editor][editor]('activate', data);
      }, this);
    },

    _bindEditables: function () {
      var widget = this;
      var createElement = jQuery(this.options.createElement);
      createElement.on(this.options.editableNs + 'activated', function (event, data) {
        // An editable has been activated. Tell our metadata editors
        // about it
        widget.activateEditors({
          entity: data.entity,
          entityElement: data.entityElement,
          predicate: data.predicate
        });
      });
    },

    _prepareEditorArea: function (button) {
      var contentArea = jQuery(_.template(this.options.templates.contentArea, {}));
      contentArea.hide();
      return contentArea;
    },

    _render: function () {
      var widget = this;

      var button = jQuery(_.template(this.options.templates.button, {
        icon: 'info-sign',
        label: this.options.localize('Metadata', this.options.language)
      }));

      this.element.empty();
      this.element.append(button);
      this.element.hide();

      this.contentArea = this._prepareEditorArea(button);
      button.after(this.contentArea);

      button.on('click', function(event) {
        event.preventDefault();

        var offset = button.position();
        widget.contentArea.css({
          position: 'absolute',
          left: offset.left
        });

        widget.contentArea.toggle();
      });
    }
  });
})(jQuery);
