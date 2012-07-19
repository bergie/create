//     Create.js - On-site web editing interface
//     (c) 2011-2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  // # Create editing widget
  jQuery.widget('Midgard.midgardEditable', {
    options: {
      editables: [],
      collections: [],
      model: null,
      editors: {
        hallo: {
          widget: 'halloWidget',
          options: {}
        }
      },
      // the available widgets by data type
      widgets: {
        default: 'hallo'
      },
      collectionWidgets: {
        'default': 'midgardCollectionAdd'
      },
      toolbarState: 'full',
      vie: null,
      disabled: false
    },

    _create: function () {
      this.vie = this.options.vie;
      if (!this.options.model) {
        var widget = this;
        this.vie.load({element: this.element}).from('rdfa').execute().done(function (entities) {
          widget.options.model = entities[0];
        });
      }
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
      if (!this.options.model) {
        return;
      }
      this.vie.service('rdfa').findPredicateElements(this.options.model.id, jQuery('[property]', this.element), false).each(function () {
        return widget._enableProperty(jQuery(this));
      });

      this._trigger('enable', null, {
        instance: this.options.model,
        entityElement: this.element
      });

      _.forEach(this.vie.service('rdfa').views, function (view) {
        if (view instanceof widget.vie.view.Collection && widget.options.model === view.owner) {
          var collection = widget.enableCollection({
            model: widget.options.model,
            collection: view.collection,
            view: view,
            element: view.el,
            vie: widget.vie,
            editableOptions: widget.options
          });
          widget.options.collections.push(collection);
        }
      });
    },

    disable: function () {
      var widget = this;
      jQuery.each(this.options.editables, function (index, editable) {
        widget.disableEditor({
          widget: widget,
          editable: editable,
          entity: widget.options.model,
          element: jQuery(this)
        });
      });
      this.options.editables = [];
      jQuery.each(this.options.collections, function (index, collectionWidget) {
        widget.disableCollection({
          widget: widget,
          model: widget.options.model,
          element: collectionWidget,
          vie: widget.vie,
          editableOptions: widget.options
        });
      });
      this.options.collections = [];

      this._trigger('disable', null, {
        instance: this.options.model,
        entityElement: this.element
      });
    },

    _enableProperty: function (element) {
      var widget = this;
      var propertyName = this.vie.service('rdfa').getElementPredicate(element);
      if (!propertyName) {
        return true;
      }
      if (this.options.model.get(propertyName) instanceof Array) {
        // For now we don't deal with multivalued properties in the editable
        return true;
      }

      var editable = this.enableEditor({
        widget: this,
        element: element,
        entity: this.options.model,
        property: propertyName,
        vie: this.vie,
        modified: function (content) {
          var changedProperties = {};
          changedProperties[propertyName] = content;
          widget.options.model.set(changedProperties, {
            silent: true
          });
          widget._trigger('changed', null, {
            property: propertyName,
            instance: widget.options.model,
            element: element,
            entityElement: widget.element
          });
        },
        activated: function () {
          widget._trigger('activated', null, {
            property: propertyName,
            instance: widget.options.model,
            element: element,
            entityElement: widget.element
          });
        },
        deactivated: function () {
          widget._trigger('deactivated', null, {
            property: propertyName,
            instance: widget.options.model,
            element: element,
            entityElement: widget.element
          });
        }
      });

      this._trigger('enableproperty', null, {
        editable: editable,
        property: propertyName,
        instance: this.options.model,
        element: element,
        entityElement: this.element
      });

      this.options.editables.push(editable);
    },

    // returns the name of the widget to use for the given property
    _editorName: function (data) {
      if (this.options.widgets[data.property] !== undefined) {
        // Widget configuration set for specific RDF predicate
        return this.options.widgets[data.property];
      }

      // Load the widget configuration for the data type
      // TODO: make sure type is already loaded into VIE
      var propertyType = 'default';
      var type = this.options.model.get('@type');
      if (type) {
        if (type.attributes && type.attributes.get(data.property)) {
          propertyType = type.attributes.get(data.property).range[0];
        }
      }
      if (this.options.widgets[propertyType] !== undefined) {
        return this.options.widgets[propertyType];
      }
      return this.options.widgets['default'];
    },

    _editorWidget: function (editor) {
      return this.options.editors[editor].widget;
    },

    _editorOptions: function (editor) {
      return this.options.editors[editor].options;
    },

    enableEditor: function (data) {
      var editorName = this._editorName(data);
      if (editorName === null) {
        return;
      }

      var editorWidget = this._editorWidget(editorName);

      data.editorOptions = this._editorOptions(editorName);
      data.disabled = false;

      if (typeof jQuery(data.element)[editorWidget] !== 'function') {
        throw new Error(widgetName + ' widget is not available');
      }

      jQuery(data.element)[editorWidget](data);
      jQuery(data.element).data('createWidgetName', editorWidget);
      return jQuery(data.element);
    },

    disableEditor: function (data) {
      var widgetName = jQuery(data.element).data('createWidgetName');

      data.disabled = true;

      if (widgetName) {
        // only if there has been an editing widget registered
        jQuery(data.element)[widgetName](data);
        jQuery(data.element).removeClass('ui-state-disabled');
      }
    },

    collectionWidgetName: function (data) {
      // TODO: Actual selection mechanism
      return this.options.collectionWidgets['default'];
    },

    enableCollection: function (data) {
      var widgetName = this.collectionWidgetName(data);
      data.disabled = false;
      if (typeof jQuery(data.element)[widgetName] !== 'function') {
        throw new Error(widgetName + ' widget is not available');
      }
      jQuery(data.element)[widgetName](data);
      jQuery(data.element).data('createCollectionWidgetName', widgetName);
      return jQuery(data.element);
    },

    disableCollection: function (data) {
      var widgetName = jQuery(data.element).data('createCollectionWidgetName');
      data.disabled = true;
      if (widgetName) {
        // only if there has been an editing widget registered
        jQuery(data.element)[widgetName](data);
        jQuery(data.element).removeClass('ui-state-disabled');
      }
    }
  });
})(jQuery);
