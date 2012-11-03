//     Create.js - On-site web editing interface
//     (c) 2011-2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false VIE:false */
  'use strict';

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
        'default': 'hallo'
      },
      collectionWidgets: {
        'default': 'midgardCollectionAdd'
      },
      toolbarState: 'full',
      vie: null,
      domService: 'rdfa',
      predicateSelector: '[property]',
      disabled: false,
      localize: function (id, language) {
        return window.midgardCreate.localize(id, language);
      },
      language: null,
      state: null,
      acceptStateChange: true
    },

    _create: function () {
      this.vie = this.options.vie;
      this.domService = this.vie.service(this.options.domService);
      if (!this.options.model) {
        var widget = this;
        this.vie.load({
          element: this.element
        }).from(this.options.domService).execute().done(function (entities) {
          widget.options.model = entities[0];
        });
      }
    },

    _init: function () {
      // Old way of setting the widget inactive
      if (this.options.disabled === true) {
        this.setState('inactive');
        return;
      }

      if (this.options.disabled === false && this.options.state === 'inactive') {
        this.setState('candidate');
        return;
      }
      this.options.disabled = false;

      if (this.options.state) {
        this.setState(this.options.state);
        return;
      }
      this.setState('candidate');
    },

    // Method used for cycling between the different states of the Editable widget:
    //
    // * Inactive: editable is loaded but disabled
    // * Candidate: editable is enabled but not activated
    // * Highlight: user is hovering over the editable (not set by Editable widget directly)
    // * Activating: an editor widget is being activated for user to edit with it (skipped for editors that activate instantly)
    // * Active: user is actually editing something inside the editable
    // * Modified: user has made changes to the editable
    // * Invalid: the contents of the editable have validation errors
    setState: function (state) {
      var previous = this.options.state;
      var current = state;
      if (current === previous) {
        return;
      }

      if (this.options.acceptStateChange === undefined || !_.isFunction(this.options.acceptStateChange)) {
        // Skip state transition validation
        this._doSetState(previous, current);
        return;
      }

      var widget = this;
      this.options.acceptStateChange(previous, current, function (accepted) {
        if (!accepted) {
          return;
        }
        widget._doSetState(previous, current);
      });
    },

    _doSetState: function (previous, current) {
      this.options.state = current;
      if (current === 'inactive') {
        this.disable();
      } else if ((previous === null || previous === 'inactive') && current !== 'inactive') {
        this.enable();
      }

      this._trigger('statechange', null, {
        previous: previous,
        current: current,
        instance: this.options.model,
        entityElement: this.element
      });
    },

    findEditableElements: function (callback) {
      this.domService.findPredicateElements(this.options.model.id, jQuery(this.options.predicateSelector, this.element), false).each(callback);
    },

    getElementPredicate: function (element) {
      return this.domService.getElementPredicate(element);
    },

    enable: function () {
      var widget = this;
      if (!this.options.model) {
        return;
      }

      this.findEditableElements(function () {
        return widget._enableProperty(jQuery(this));
      });

      this._trigger('enable', null, {
        instance: this.options.model,
        entityElement: this.element
      });

      _.each(this.domService.views, function (view) {
        if (view instanceof widget.vie.view.Collection && widget.options.model === view.owner) {
          var property = view.collection.predicate;
          var collection = widget.enableCollection({
            model: widget.options.model,
            collection: view.collection,
            property: property,
            definition: widget.getAttributeDefinition(property),
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
      _.each(this.options.editables, function (editable) {
        this.disableEditor({
          widget: this,
          editable: editable,
          entity: this.options.model,
          element: jQuery(editable)
        });
      }, this);
      this.options.editables = [];
      _.each(this.options.collections, function (collectionWidget) {
        this.disableCollection({
          widget: this,
          model: this.options.model,
          element: collectionWidget,
          vie: this.vie,
          editableOptions: this.options
        });
      }, this);
      this.options.collections = [];

      this._trigger('disable', null, {
        instance: this.options.model,
        entityElement: this.element
      });
    },

    _enableProperty: function (element) {
      var widget = this;
      var propertyName = this.getElementPredicate(element);
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
          widget.setState('modified');

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
        activating: function () {
          widget.setState('activating');
        },
        activated: function () {
          widget.setState('active');
          widget._trigger('activated', null, {
            property: propertyName,
            instance: widget.options.model,
            element: element,
            entityElement: widget.element
          });
        },
        deactivated: function () {
          widget.setState('candidate');
          widget._trigger('deactivated', null, {
            property: propertyName,
            instance: widget.options.model,
            element: element,
            entityElement: widget.element
          });
        }
      });

      if (!editable) {
        return;
      }
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
      var propertyType = 'default';
      var attributeDefinition = this.getAttributeDefinition(data.property);
      if (attributeDefinition) {
        propertyType = attributeDefinition.range[0];
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

    getAttributeDefinition: function (property) {
      var type = this.options.model.get('@type');
      if (!type) {
        return;
      }
      if (!type.attributes) {
        return;
      }
      return type.attributes.get(property);
    },

    enableEditor: function (data) {
      var editorName = this._editorName(data);
      if (editorName === null) {
        return;
      }

      var editorWidget = this._editorWidget(editorName);

      data.editorOptions = this._editorOptions(editorName);
      data.toolbarState = this.options.toolbarState;
      data.disabled = false;

      if (typeof jQuery(data.element)[editorWidget] !== 'function') {
        throw new Error(editorWidget + ' widget is not available');
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

        if (data.element.is(':focus')) {
          data.element.blur();
        }
      }
    },

    collectionWidgetName: function (data) {
      if (this.options.collectionWidgets[data.property] !== undefined) {
        // Widget configuration set for specific RDF predicate
        return this.options.collectionWidgets[data.property];
      }

      var propertyType = 'default';
      var attributeDefinition = this.getAttributeDefinition(data.property);
      if (attributeDefinition) {
        propertyType = attributeDefinition.range[0];
      }
      if (this.options.collectionWidgets[propertyType] !== undefined) {
        return this.options.collectionWidgets[propertyType];
      }
      return this.options.collectionWidgets['default'];
    },

    enableCollection: function (data) {
      var widgetName = this.collectionWidgetName(data);
      if (widgetName === null) {
        return;
      }
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
      if (widgetName === null) {
        return;
      }
      data.disabled = true;
      if (widgetName) {
        // only if there has been an editing widget registered
        jQuery(data.element)[widgetName](data);
        jQuery(data.element).removeClass('ui-state-disabled');
      }
    }
  });
})(jQuery);
