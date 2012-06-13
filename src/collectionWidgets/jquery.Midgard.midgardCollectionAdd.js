//     Create.js - On-site web editing interface
//     (c) 2011-2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  // # Create editing widget
  jQuery.widget('Midgard.midgardCollectionAdd', {
    addButton: null,

    options: {
      editingWidgets: null,
      collection: null,
      model: null,
      view: null,
      disabled: false,
      vie: null,
      editableOptions: null
    },

    _create: function () {
      var widget = this;
      widget.options.collection.url = widget.options.model.url();

      widget.options.view.bind('add', function (itemView) {
        //itemView.el.effect('slide');
        widget.options.editableOptions.disabled = widget.options.disabled;
        widget.options.editableOptions.model = itemView.model;
        jQuery(itemView.el).midgardEditable(widget.options.editableOptions);
      });

      widget.options.view.collection.bind('add', function (model) {
        model.primaryCollection = widget.options.collection;
        widget.options.vie.entities.add(model);
        model.collection = widget.options.collection;
      });
    },

    _init: function () {
      if (this.options.disabled) {
        this.disable();
        return;
      }
      this.enable();
    },

    enable: function () {
      var widget = this;
      widget.addButton = jQuery('<button class="btn"><i class="icon-plus"></i> Add</button>').button();
      widget.addButton.addClass('midgard-create-add');
      widget.addButton.click(function () {
        widget.options.collection.add({});
      });

      jQuery(widget.options.view.el).after(widget.addButton);
    },

    disable: function () {
      this.addButton.remove();
      delete this.addButton;
    }
  });
})(jQuery);
