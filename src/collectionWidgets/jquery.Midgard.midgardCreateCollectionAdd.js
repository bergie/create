//     Create.js - On-site web editing interface
//     (c) 2011-2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  // # Widget for adding items to a collection
  jQuery.widget('Midgard.midgardCollectionAdd', {
    addButtons: [],

    options: {
      editingWidgets: null,
      collection: null,
      model: null,
      definition: null,
      view: null,
      disabled: false,
      vie: null,
      editableOptions: null
    },

    _create: function () {
      var widget = this;
      if (!widget.options.collection.localStorage) {
        widget.options.collection.url = widget.options.model.url();
      }

      widget.options.collection.bind('add', function (model) {
        model.primaryCollection = widget.options.collection;
        widget.options.vie.entities.add(model);
        model.collection = widget.options.collection;
      });

      // Re-check collection constraints
      widget.options.collection.bind('add remove reset', widget.checkCollectionConstraints, widget);

      widget._bindCollectionView(widget.options.view);
    },

    _bindCollectionView: function (view) {
      var widget = this;
      view.bind('add', function (itemView) {
        itemView.$el.effect('slide', function () {
          widget._makeEditable(itemView);
        });
      });
    },

    _makeEditable: function (itemView) {
      this.options.editableOptions.disabled = this.options.disabled;
      this.options.editableOptions.model = itemView.model;
      jQuery(itemView.el).midgardEditable(this.options.editableOptions);
    },

    _init: function () {
      if (this.options.disabled) {
        this.disable();
        return;
      }
      this.enable();
    },

    checkCollectionConstraints: function () {
      if (this.options.disabled) {
        return;
      }

      if (!this.options.definition) {
        // We have now information on the constraints applying to this collection
        return;
      }

      if (!this.options.definition.max || this.options.definition.max === -1) {
        // No maximum constraint
        return;
      }
      
      if (this.options.view.canAdd() && this.options.collection.length < this.options.definition.max) {
        _.each(this.addButtons, function (button) {
          button.show();
        });
        return;
      }
      // Collection is already full by its definition
      _.each(this.addButtons, function (button) {
        button.hide();
      });
    },

    enable: function () {
      var widget = this;

      var addButton = jQuery('<button class="btn"><i class="icon-plus"></i> Add</button>').button();
      addButton.addClass('midgard-create-add');
      addButton.click(function () {
        widget.options.collection.add({});
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
    }
  });
})(jQuery);
