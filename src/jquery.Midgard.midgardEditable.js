/*
//     Create.js - On-site web editing interface
//     (c) 2011-2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
*/
(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false VIE:false */
  'use strict';

  // Define Create's EditableEntity widget.
  jQuery.widget('Midgard.midgardEditable', {
    options: {
      propertyEditors: {},
      collections: [],
      model: null,
      // the configuration (mapping and options) of property editor widgets
      propertyEditorWidgetsConfiguration: {
        hallo: {
          widget: 'halloWidget',
          options: {}
        }
      },
      // the available property editor widgets by data type
      propertyEditorWidgets: {
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
      // Current state of the Editable
      state: null,
      // Callback function for validating changes between states. Receives the previous state, new state, possibly property, and a callback
      acceptStateChange: true,
      // Callback function for listening (and reacting) to state changes.
      stateChange: null,
      // Callback function for decorating the full editable. Will be called on instantiation
      decorateEditableEntity: null,
      // Callback function for decorating a single property editor widget. Will
      // be called on editing widget instantiation.
      decoratePropertyEditor: null,

      // Deprecated.
      editables: [], // Now `propertyEditors`.
      editors: {}, // Now `propertyEditorWidgetsConfiguration`.
      widgets: {} // Now `propertyEditorW
    },

    // Aids in consistently passing parameters to events and callbacks.
    _params: function(predicate, extended) {
      var entityParams = {
        entity: this.options.model,
        editableEntity: this,
        entityElement: this.element,

        // Deprecated.
        editable: this,
        element: this.element,
        instance: this.options.model
      };
      var propertyParams = (predicate) ? {
        predicate: predicate,
        propertyEditor: this.options.propertyEditors[predicate],
        propertyElement: this.options.propertyEditors[predicate].element,

        // Deprecated.
        property: predicate,
        element: this.options.propertyEditors[predicate].element
      } : {};

      return _.extend(entityParams, propertyParams, extended);
    },

    _create: function () {
      // Backwards compatibility:
      // - this.options.propertyEditorWidgets used to be this.options.widgets
      // - this.options.propertyEditorWidgetsConfiguration used to be
      //   this.options.editors
      if (this.options.widgets) {
        this.options.propertyEditorWidgets = _.extend(this.options.propertyEditorWidgets, this.options.widgets);
      }
      if (this.options.editors) {
        this.options.propertyEditorWidgetsConfiguration = _.extend(this.options.propertyEditorWidgetsConfiguration, this.options.editors);
      }

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
      if (_.isFunction(this.options.decorateEditableEntity)) {
        this.options.decorateEditableEntity(this._params());
      }
    },

    _init: function () {
      // Backwards compatibility:
      // - this.options.propertyEditorWidgets used to be this.options.widgets
      // - this.options.propertyEditorWidgetsConfiguration used to be
      //   this.options.editors
      if (this.options.widgets) {
        this.options.propertyEditorWidgets = _.extend(this.options.propertyEditorWidgets, this.options.widgets);
      }
      if (this.options.editors) {
        this.options.propertyEditorWidgetsConfiguration = _.extend(this.options.propertyEditorWidgetsConfiguration, this.options.editors);
      }

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
    // * Changed: user has made changes to the editable
    // * Invalid: the contents of the editable have validation errors
    //
    // In situations where state changes are triggered for a particular property editor, the `predicate`
    // argument will provide the name of that property.
    //
    // State changes may carry optional context information in a JavaScript object. The payload of these context objects is not
    // standardized, and is meant to be set and used by the application controller
    //
    // The callback parameter is optional and will be invoked after a state change has been accepted (after the 'statechange'
    // event) or rejected.
    setState: function (state, predicate, context, callback) {
      var previous = this.options.state;
      var current = state;
      if (current === previous) {
        return;
      }

      if (this.options.acceptStateChange === undefined || !_.isFunction(this.options.acceptStateChange)) {
        // Skip state transition validation
        this._doSetState(previous, current, predicate, context);
        if (_.isFunction(callback)) {
          callback(true);
        }
        return;
      }

      var widget = this;
      this.options.acceptStateChange(previous, current, predicate, context, function (accepted) {
        if (accepted) {
          widget._doSetState(previous, current, predicate, context);
        }
        if (_.isFunction(callback)) {
          callback(accepted);
        }
        return;
      });
    },

    getState: function () {
      return this.options.state;
    },

    _doSetState: function (previous, current, predicate, context) {
      this.options.state = current;
      if (current === 'inactive') {
        this.disable();
      } else if ((previous === null || previous === 'inactive') && current !== 'inactive') {
        this.enable();
      }

      this._trigger('statechange', null, this._params(predicate, {
        previous: previous,
        current: current,
        context: context
      }));
    },

    findEditablePredicateElements: function (callback) {
      this.domService.findPredicateElements(this.options.model.id, jQuery(this.options.predicateSelector, this.element), false).each(callback);
    },

    getElementPredicate: function (element) {
      return this.domService.getElementPredicate(element);
    },

    enable: function () {
      var editableEntity = this;
      if (!this.options.model) {
        return;
      }

      this.findEditablePredicateElements(function () {
        editableEntity._enablePropertyEditor(jQuery(this));
      });

      this._trigger('enable', null, this._params());

      if (!this.vie.view || !this.vie.view.Collection) {
        return;
      }

      _.each(this.domService.views, function (view) {
        if (view instanceof this.vie.view.Collection && this.options.model === view.owner) {
          var predicate = view.collection.predicate;
          var editableOptions = _.clone(this.options);
          editableOptions.state = null;
          var collection = this.enableCollection({
            model: this.options.model,
            collection: view.collection,
            property: predicate,
            definition: this.getAttributeDefinition(predicate),
            view: view,
            element: view.el,
            vie: editableEntity.vie,
            editableOptions: editableOptions
          });
          editableEntity.options.collections.push(collection);
        }
      }, this);
    },

    disable: function () {
      _.each(this.options.propertyEditors, function (editable) {
        this.disablePropertyEditor({
          widget: this,
          editable: editable,
          entity: this.options.model,
          element: editable.element
        });
      }, this);
      this.options.propertyEditors = {};

      // Deprecated.
      this.options.editables = [];

      _.each(this.options.collections, function (collectionWidget) {
        var editableOptions = _.clone(this.options);
        editableOptions.state = 'inactive';
        this.disableCollection({
          widget: this,
          model: this.options.model,
          element: collectionWidget,
          vie: this.vie,
          editableOptions: editableOptions
        });
      }, this);
      this.options.collections = [];

      this._trigger('disable', null, this._params());
    },

    _enablePropertyEditor: function (element) {
      var widget = this;
      var predicate = this.getElementPredicate(element);
      if (!predicate) {
        return true;
      }
      if (this.options.model.get(predicate) instanceof Array) {
        // For now we don't deal with multivalued properties in the editable
        return true;
      }

      var propertyElement = this.enablePropertyEditor({
        widget: this,
        element: element,
        entity: this.options.model,
        property: predicate,
        vie: this.vie,
        decorate: this.options.decoratePropertyEditor,
        decorateParams: _.bind(this._params, this),
        changed: function (content) {
          widget.setState('changed', predicate);

          var changedProperties = {};
          changedProperties[predicate] = content;
          widget.options.model.set(changedProperties, {
            silent: true
          });

          widget._trigger('changed', null, widget._params(predicate));
        },
        activating: function () {
          widget.setState('activating', predicate);
        },
        activated: function () {
          widget.setState('active', predicate);
          widget._trigger('activated', null, widget._params(predicate));
        },
        deactivated: function () {
          widget.setState('candidate', predicate);
          widget._trigger('deactivated', null, widget._params(predicate));
        }
      });

      if (!propertyElement) {
        return;
      }
      var widgetType = propertyElement.data('createWidgetName');
      this.options.propertyEditors[predicate] = propertyElement.data('Midgard-' + widgetType);
      if (!this.options.propertyEditors[predicate]) {
        // pre-1.10 jQuery UI
        this.options.propertyEditors[predicate] = propertyElement.data(widgetType);
      }

      // Deprecated.
      this.options.editables.push(propertyElement);

      this._trigger('enableproperty', null, this._params(predicate));
    },

    // returns the name of the property editor widget to use for the given property
    _propertyEditorName: function (data) {
      if (this.options.propertyEditorWidgets[data.property] !== undefined) {
        // Property editor widget configuration set for specific RDF predicate
        return this.options.propertyEditorWidgets[data.property];
      }

      // Load the property editor widget configuration for the data type
      var propertyType = 'default';
      var attributeDefinition = this.getAttributeDefinition(data.property);
      if (attributeDefinition) {
        propertyType = attributeDefinition.range[0];
      }
      if (this.options.propertyEditorWidgets[propertyType] !== undefined) {
        return this.options.propertyEditorWidgets[propertyType];
      }
      return this.options.propertyEditorWidgets['default'];
    },

    _propertyEditorWidget: function (editor) {
      return this.options.propertyEditorWidgetsConfiguration[editor].widget;
    },

    _propertyEditorOptions: function (editor) {
      return this.options.propertyEditorWidgetsConfiguration[editor].options;
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

    // Deprecated.
    enableEditor: function (data) {
      return this.enablePropertyEditor(data);
    },

    enablePropertyEditor: function (data) {
      var editorName = this._propertyEditorName(data);
      if (editorName === null) {
        return;
      }

      var editorWidget = this._propertyEditorWidget(editorName);

      data.editorOptions = this._propertyEditorOptions(editorName);
      data.toolbarState = this.options.toolbarState;
      data.disabled = false;
      // Pass metadata that could be useful for some implementations.
      data.editorName = editorName;
      data.editorWidget = editorWidget;

      if (typeof jQuery(data.element)[editorWidget] !== 'function') {
        throw new Error(editorWidget + ' widget is not available');
      }

      jQuery(data.element)[editorWidget](data);
      jQuery(data.element).data('createWidgetName', editorWidget);
      return jQuery(data.element);
    },

    // Deprecated.
    disableEditor: function (data) {
      return this.disablePropertyEditor(data);
    },

    disablePropertyEditor: function (data) {
      data.element[data.editable.widgetName]({
        disabled: true
      });
      jQuery(data.element).removeClass('ui-state-disabled');

      if (data.element.is(':focus')) {
        data.element.blur();
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
