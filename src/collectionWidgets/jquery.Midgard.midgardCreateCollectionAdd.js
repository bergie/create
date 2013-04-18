/*
//     Create.js - On-site web editing interface
//     (c) 2011-2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
*/
(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false console:false */
  'use strict';

  // # Widget for adding items to a collection
  jQuery.widget('Midgard.midgardCollectionAdd', {
    options: {
      editingWidgets: null,
      collection: null,
      model: null,
      definition: null,
      view: null,
      disabled: false,
      vie: null,
      editableOptions: null,
      templates: {
        button: '<button class="btn"><i class="icon-<%= icon %>"></i> <%= label %></button>'
      }
    },

    _create: function () {
      this.addButtons = [];
      var widget = this;
      if (!widget.options.collection.localStorage) {
        try {
          widget.options.collection.url = widget.options.model.url();
        } catch (e) {
          if (window.console) {
            console.log(e);
          }
        }
      }

      widget.options.collection.on('add', function (model) {
        model.primaryCollection = widget.options.collection;
        widget.options.vie.entities.add(model);
        model.collection = widget.options.collection;
      });

      // Re-check collection constraints
      widget.options.collection.on('add remove reset', widget.checkCollectionConstraints, widget);

      widget._bindCollectionView(widget.options.view);
    },

    _bindCollectionView: function (view) {
      var widget = this;
      view.on('add', function (itemView) {
        itemView.$el.effect('slide', function () {
          widget._makeEditable(itemView);
        });
      });
    },

    _makeEditable: function (itemView) {
      this.options.editableOptions.disabled = this.options.disabled;
      this.options.editableOptions.model = itemView.model;
      itemView.$el.midgardEditable(this.options.editableOptions);
    },

    _init: function () {
      if (this.options.disabled) {
        this.disable();
        return;
      }
      this.enable();
    },

    hideButtons: function () {
      _.each(this.addButtons, function (button) {
        button.hide();
      });
    },

    showButtons: function () {
      _.each(this.addButtons, function (button) {
        button.show();
      });
    },

    checkCollectionConstraints: function () {
      if (this.options.disabled) {
        return;
      }

      if (!this.options.view.canAdd()) {
        this.hideButtons();
        return;
      }

      if (!this.options.definition) {
        // We have now information on the constraints applying to this collection
        this.showButtons();
        return;
      }

      if (!this.options.definition.max || this.options.definition.max === -1) {
        // No maximum constraint
        this.showButtons();
        return;
      }

      if (this.options.collection.length < this.options.definition.max) {
        this.showButtons();
        return;
      }
      // Collection is already full by its definition
      this.hideButtons();
    },

    enable: function () {
      var widget = this;

      var addButton = jQuery(_.template(this.options.templates.button, {
        icon: 'plus',
        label: this.options.editableOptions.localize('Add', this.options.editableOptions.language)
      })).button();
      addButton.addClass('midgard-create-add');
      addButton.click(function () {
        widget.addItem(addButton);
      });
      jQuery(widget.options.view.el).after(addButton);

      widget.addButtons.push(addButton);
      widget.checkCollectionConstraints();
    },

    disable: function () {
      _.each(this.addButtons, function (button) {
        button.remove();
      });
      this.addButtons = [];
    },

    _getTypeActions: function (options) {
      var widget = this;
      var actions = [];
      _.each(this.options.definition.range, function (type) {
        var nsType = widget.options.collection.vie.namespaces.uri(type);
        if (!widget.options.view.canAdd(nsType)) {
          return;
        }
        actions.push({
          name: type,
          label: type,
          cb: function () {
            widget.options.collection.add({
              '@type': type
            }, options);
          },
          className: 'create-ui-btn'
        });
      });
      return actions;
    },

    addItem: function (button, options) {
      if (options === undefined) {
          options = {};
      }
      var addOptions = _.extend({}, options, { validate: false });

      var itemData = {};
      if (this.options.definition && this.options.definition.range) {
        if (this.options.definition.range.length === 1) {
          // Items can be of single type, add that
          itemData['@type'] = this.options.definition.range[0];
        } else {
          // Ask user which type to add
          jQuery('body').midgardNotifications('create', {
            bindTo: button,
            gravity: 'L',
            body: this.options.editableOptions.localize('Choose type to add', this.options.editableOptions.language),
            timeout: 0,
            actions: this._getTypeActions(addOptions)
          });
          return;
        }
      } else {
        // Check the view templates for possible non-Thing type to use
        var keys = _.keys(this.options.view.templates);
        if (keys.length == 2) {
          itemData['@type'] = keys[0];
        }
      }
      this.options.collection.add(itemData, addOptions);
    }
  });
})(jQuery);
