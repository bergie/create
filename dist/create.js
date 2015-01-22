/* Create.js 1.0.0alpha4 - Inline editing toolkit
by Henri Bergius and contributors. Available under the MIT license.
See http://createjs.org for more information
*/(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false VIE:false */
  'use strict';

  // # Create main widget
  //
  // The `midgardCreate` widget is the main entry point into using
  // Create for editing content.
  //
  // While most individual Create widgets can also be used separately,
  // the most common use case is to instantiate `midgardCreate` for
  // your pages and let it handle editables, toolbars, and storate.
  //
  //     jQuery('body').midgardCreate();
  jQuery.widget('Midgard.midgardCreate', {
    // ## Configuration
    //
    // Like most jQuery UI widgets, Create accepts various options
    // when being instantiated.
    options: {
      // Initial toolbar rendering style: `full` or `minimized`.
      toolbar: 'full',
      // The *Save* jQuery UI button instance.
      saveButton: null,
      // Initial usage state: `browse` or `edit`
      state: 'browse',
      // Whether to highlight editable elements when entering `edit`
      // state.
      highlight: true,
      // Color for the highlights.
      highlightColor: '#67cc08',
      // Widgets to use for editing various content types.
      editorWidgets: {
        'default': 'hallo'
      },
      // Additional editor options.
      editorOptions: {
        hallo: {
          widget: 'halloWidget'
        }
      },
      // Widgets to use for managing collections.
      collectionWidgets: {
        'default': 'midgardCollectionAdd'
      },
      // URL callback used with Backbone.sync. Will be passed to the
      // Storage widget.
      url: function () {},
      // Prefix used for localStorage.
      storagePrefix: 'node',
      // Workflow configuration. URL callback is used for retrieving
      // list of workflow actions that can be initiated for an item.
      workflows: {
        url: null
      },
      // Notifications configuration.
      notifications: {},
      // VIE instance used with Create.js. If no VIE instance is passed,
      // Create.js will create its own instance.
      vie: null,
      // The VIE service used for DOM handling. By default 'rdfa'
      domService: 'rdfa',
      // URL for the Apache Stanbol service used for annotations, and tag
      // and image suggestions.
      stanbolUrl: null,
      // URL for the DBpedia instance used for finding more information
      // about annotations and tags.
      dbPediaUrl: null,
      // Configuration for the metadata editor. If no widgets are enabled,
      // then the metadata editor will not be loaded.
      metadata: {},
      // Selector for element where Create.js will place its buttons, like
      // Save and Edit/Cancel.
      buttonContainer: '.create-ui-toolbar-statustoolarea .create-ui-statustools',
      // Templates used for UI elements of the Create widget
      templates: {
        buttonContent: '<%= label %> <i class="fa fa-<%= icon %>"></i>',
        button: '<li id="<%= id %>"><a class="create-ui-btn"><%= buttonContent %></a></li>'
      },
      // Localization callback function. Will be run in the widget context.
      // Override to connect Create.js with your own localization system
      localize: function (id, language) {
        return window.midgardCreate.localize(id, language);
      },
      // Language used for Create.js. Will be retrieved from page lang attrib
      // if left blank
      language: null
    },

    _create: function () {
      this.vie = this._setupVIE(this.options);
      this.domService = this.vie.service(this.options.domService);

      var widget = this;
      window.setTimeout(function () {
        widget._checkSession();
      }, 10);

      if (!this.options.language) {
        this.options.language = jQuery('html').attr('lang');
      }
      
      if(this.options.toolbar) {
        this._enableToolbar();
      }
      
      this._enableMetadata();
      this._saveButton();
      this._editButton();
      this._prepareStorage();

      if (this.element.midgardWorkflows) {
        this.element.midgardWorkflows(this.options.workflows);
      }

      if (this.element.midgardNotifications) {
        this.element.midgardNotifications(this.options.notifications);
      }

      this._bindShortcuts();
    },

    destroy: function () {
      // Clean up on widget destruction
      this.element.midgardStorage('destroy');
      this.element.midgardToolbar('destroy');

      this.domService.findSubjectElements(this.element).each(function () {
        jQuery(this).midgardEditable('destroy');
      });

      // Conditional widgets
      if (this.element.midgardWorkflows) {
        this.element.midgardWorkflows('destroy');
      }
      if (this.element.midgardNotifications) {
        this.element.midgardNotifications('destroy');
      }
      if (!_.isEmpty(this.options.metadata)) {
        this.element.midgardMetadata('destroy');
      }
      // TODO: use _destroy in jQuery UI 1.9 and above
      jQuery.Widget.prototype.destroy.call(this);
    },

    _setupVIE: function (options) {
      var vie;
      if (options.vie) {
        vie = options.vie;
      } else {
        // Set up our own VIE instance
        vie = new VIE();
      }

      if (!vie.hasService(this.options.domService) && this.options.domService === 'rdfa') {
        vie.use(new vie.RdfaService());
      }

      if (!vie.hasService('stanbol') && options.stanbolUrl) {
        vie.use(new vie.StanbolService({
          proxyDisabled: true,
          url: options.stanbolUrl
        }));
      }

      if (!vie.hasService('dbpedia') && options.dbPediaUrl) {
        vie.use(new vie.DBPediaService({
          proxyDisabled: true,
          url: options.dbPediaUrl
        }));
      }

      return vie;
    },

    _prepareStorage: function () {
      this.element.midgardStorage({
        vie: this.vie,
        url: this.options.url,
        localize: this.options.localize,
        language: this.options.language,
        storagePrefix: this.options.storagePrefix
      });

      var widget = this;
      this.element.on('midgardstoragesave', function () {
        jQuery('#midgardcreate-save a').html(_.template(widget.options.templates.buttonContent, {
          label: widget.options.localize('Saving', widget.options.language),
          icon: 'upload'
        }));
      });

      this.element.on('midgardstoragesaved midgardstorageerror', function () {
        jQuery('#midgardcreate-save a').html(_.template(widget.options.templates.buttonContent, {
          label: widget.options.localize('Save', widget.options.language),
          icon: 'ok'
        }));
      });
    },

    _init: function () {
      this.setState(this.options.state);
    },

    setState: function (state) {
      this._setOption('state', state);
      if (state === 'edit') {
        this._enableEdit();
      } else {
        this._disableEdit();
      }
      this._setEditButtonState(state);
    },

    setToolbar: function (state) {
      this.options.toolbar = state;
      if (!this.element.data('Midgard-midgardToolbar') && !this.element.data('midgardToolbar')) {
        // Toolbar not yet instantiated
        return;
      }
      this.element.midgardToolbar('setDisplay', state);
    },

    showNotification: function (options) {
      if (this.element.midgardNotifications) {
        return this.element.midgardNotifications('create', options);
      }
    },

    configureEditor: function (name, widget, options) {
      this.options.editorOptions[name] = {
        widget: widget,
        options: options
      };
    },

    setEditorForContentType: function (type, editor) {
      if (this.options.editorOptions[editor] === undefined && editor !== null) {
        throw new Error("No editor " + editor + " configured");
      }
      this.options.editorWidgets[type] = editor;
    },

    setEditorForProperty: function (property, editor) {
      if (this.options.editorOptions[editor] === undefined && editor !== null) {
        throw new Error("No editor " + editor + " configured");
      }
      this.options.editorWidgets[property] = editor;
    },

    _checkSession: function () {
      if (!window.sessionStorage) {
        return;
      }

      var toolbarID = this.options.storagePrefix + 'Midgard.create.toolbar';
      if (window.sessionStorage.getItem(toolbarID)) {
        this.setToolbar(window.sessionStorage.getItem(toolbarID));
      }

      var stateID = this.options.storagePrefix + 'Midgard.create.state';
      if (window.sessionStorage.getItem(stateID)) {
        this.setState(window.sessionStorage.getItem(stateID));
      }

      this.element.on('midgardcreatestatechange', function (event, options) {
        window.sessionStorage.setItem(stateID, options.state);
      });
    },

    _bindShortcuts: function () {
      if (!window.Mousetrap) {
        // Keyboard shortcuts are optional and only activated if Mousetrap
        // library is available
        return;
      }

      var widget = this;
      // Ctrl-e enters edit state
      window.Mousetrap.bind(['command+e', 'ctrl+e'], function () {
        if (widget.options.state === 'edit') {
          return;
        }
        widget.setState('edit');
      });

      // Esc leaves edit state
      window.Mousetrap.bind('esc', function (event) {
        if (widget.options.state === 'browse') {
          return;
        }
        // Stop event from propagating so that possible active editable
        // doesn't get falsely triggered
        event.stopPropagation();
        widget.setState('browse');
      });

      // Ctrl-s saves
      window.Mousetrap.bind(['command+s', 'ctrl+s'], function (event) {
        event.preventDefault();
        if (!widget.options.saveButton) {
          return;
        }
        if (widget.options.saveButton.hasClass('ui-state-disabled')) {
          return;
        }
        widget.options.saveButton.click();
      });
    },

    _saveButton: function () {
      if (this.options.saveButton) {
        return this.options.saveButton;
      }
      var widget = this;
      jQuery(this.options.buttonContainer, this.element).append(jQuery(_.template(this.options.templates.button, {
        id: 'midgardcreate-save',
        buttonContent: _.template(this.options.templates.buttonContent, {
          label: widget.options.localize('Save', widget.options.language),
          icon: 'ok'
        })
      })));
      this.options.saveButton = jQuery('#midgardcreate-save', this.element);
      this.options.saveButton.hide();

      this.options.saveButton.click(function () {
        widget.element.midgardStorage('saveRemoteAll');
      });

      this.element.on('midgardeditablechanged midgardstorageloaded', function () {
        widget.options.saveButton.button({
          disabled: false
        });
      });

      this.element.on('midgardstoragesaved', function () {
        widget.options.saveButton.button({
          disabled: true
        });
      });

      this.element.on('midgardeditableenable', function () {
        widget.options.saveButton.button({
          disabled: true
        });
        widget.options.saveButton.show();
      });

      this.element.on('midgardeditabledisable', function () {
        widget.options.saveButton.hide();
      });
    },

    _editButton: function () {
      var widget = this;
      jQuery(this.options.buttonContainer, this.element).append(jQuery(_.template(this.options.templates.button, {
        id: 'midgardcreate-edit',
        buttonContent: ''
      })));
      jQuery('#midgardcreate-edit', this.element).on('click', function () {
        if (widget.options.state === 'edit') {
          widget.setState('browse');
          return;
        }
        widget.setState('edit');
      });
    },

    _setEditButtonState: function (state) {
      var widget = this;
      var buttonContents = {
        edit: _.template(this.options.templates.buttonContent, {
          label: widget.options.localize('Cancel', widget.options.language),
          icon: 'remove'
        }),
        browse: _.template(this.options.templates.buttonContent, {
          label: widget.options.localize('Edit', widget.options.language),
          icon: 'edit'
        })
      };
      var editButton = jQuery('#midgardcreate-edit a', this.element);
      if (!editButton) {
        return;
      }
      if (state === 'edit') {
        editButton.addClass('selected');
      }
      editButton.html(buttonContents[state]);
    },

    _enableToolbar: function () {
      var widget = this;
      this.element.on('midgardtoolbarstatechange', function (event, options) {
        widget.setToolbar(options.display);
        if (window.sessionStorage) {
          window.sessionStorage.setItem(widget.options.storagePrefix + 'Midgard.create.toolbar', options.display);
        }
      });

      this.element.midgardToolbar({
        display: this.options.toolbar,
        vie: this.vie
      });
    },

    _enableMetadata: function () {
      if (_.isEmpty(this.options.metadata)) {
        return;
      }

      var widget = this;

      jQuery('.create-ui-tool-metadataarea', this.element).midgardMetadata({
        vie: this.vie,
        localize: this.options.localize,
        language: this.options.language,
        editors: this.options.metadata,
        createElement: this.element,
        editableNs: 'midgardeditable'
      });

      this.element.on('midgardeditabledisable', function () {
        jQuery('.create-ui-tool-metadataarea', widget.element).hide();
      });
    },

    _enableEdit: function () {
      this._setOption('state', 'edit');
      var widget = this;
      var editableOptions = {
        toolbarState: widget.options.toolbar,
        disabled: false,
        vie: widget.vie,
        domService: widget.options.domService,
        widgets: widget.options.editorWidgets,
        editors: widget.options.editorOptions,
        collectionWidgets: widget.options.collectionWidgets,
        localize: widget.options.localize,
        language: widget.options.language
      };
      if (widget.options.enableEditor) {
        editableOptions.enableEditor = widget.options.enableEditor;
      }
      if (widget.options.disableEditor) {
        editableOptions.disableEditor = widget.options.disableEditor;
      }
      this.domService.findSubjectElements(this.element).each(function () {
        var element = this;
        if (widget.options.highlight) {
          var highlightEditable = function (event, options) {
              if (!jQuery(options.element).is(':visible')) {
                // Hidden element, don't highlight
                return;
              }
              if (options.entityElement.get(0) !== element) {
                // Propagated event from another entity, ignore
                return;
              }

              if (window.Mousetrap) {
                // contentEditable and form fields require special handling
                // to allow keyboard shortcuts to work
                options.element.addClass('mousetrap');
              }

              // Ensure other animations are stopped before proceeding
              options.element.stop(true, true);

              // Highlight the editable
              options.element.effect('highlight', {
                color: widget.options.highlightColor
              }, 3000);
            };

          jQuery(this).on('midgardeditableenableproperty', highlightEditable);
        }
        jQuery(this).on('midgardeditabledisable', function () {
          jQuery(this).off('midgardeditableenableproperty', highlightEditable);
        });

        jQuery(this).midgardEditable(editableOptions);
      });

      this._trigger('statechange', null, {
        state: 'edit'
      });
    },

    _disableEdit: function () {
      var widget = this;
      var editableOptions = {
        disabled: true,
        vie: widget.vie,
        domService: widget.options.domService,
        editorOptions: widget.options.editorOptions,
        localize: widget.options.localize,
        language: widget.options.language
      };
      this.domService.findSubjectElements(this.element).each(function () {
        jQuery(this).midgardEditable(editableOptions);
        jQuery(this).removeClass('ui-state-disabled');
      });
      this._setOption('state', 'browse');
      this._trigger('statechange', null, {
        state: 'browse'
      });
    }
  });
})(jQuery);

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
        button: '<button class="create-ui-btn"><i class="fa fa-<%= icon %>"></i> <%= label %></button>',
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

(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false Backbone:false document:false */
  'use strict';

  var _midgardnotifications_active = [];
  var MidgardNotification = function (parent, options) {
      var _defaults = {
        class_prefix: 'midgardNotifications',
        timeout: 3000,
        // Set to 0 for sticky
        auto_show: true,
        body: '',
        bindTo: null,
        gravity: 'T',
        effects: {
          onShow: function (item, cb) {
            item.animate({
              opacity: 'show'
            }, 600, cb);
          },
          onHide: function (item, cb) {
            item.animate({
              opacity: 'hide'
            }, 600, cb);
          }
        },
        actions: [],
        callbacks: {}
      };
      var _config = {};
      var _classes = {};
      var _item = null;
      var _id = null;
      var _bind_target = null;

      var _parent = parent;

      var _story = null;

      var base = {
        constructor: function (options) {
          _config = _.extend(_defaults, options || {});

          _classes = {
            container: _config.class_prefix + '-container',
            item: {
              wrapper: _config.class_prefix + '-item',
              arrow: _config.class_prefix + '-arrow',
              disregard: _config.class_prefix + '-disregard',
              content: _config.class_prefix + '-content',
              actions: _config.class_prefix + '-actions',
              action: _config.class_prefix + '-action'
            }
          };

          this._generate();
        },
        getId: function () {
          return _id;
        },
        getElement: function () {
          return _item;
        },
        _generate: function () {
          var _self = this;
          var outer, inner, content = null;

          _item = outer = jQuery('<div class="' + _classes.item.wrapper + '-outer"/>');
          outer.css({
            display: 'none'
          });
          inner = jQuery('<div class="' + _classes.item.wrapper + '-inner"/>');
          inner.appendTo(outer);

          if (_config.bindTo) {
            outer.addClass(_classes.item.wrapper + '-binded');

            var arrow = jQuery('<div class="' + _classes.item.arrow + '"/>');
            arrow.appendTo(outer);
          } else {
            outer.addClass(_classes.item.wrapper + '-normal');
          }

          content = jQuery('<div class="' + _classes.item.content + '"/>');
          content.html(_config.body);
          content.appendTo(inner);

          if (_config.actions.length) {
            var actions_holder = jQuery('<div class="' + _classes.item.actions + '"/>');
            actions_holder.appendTo(inner);
            jQuery.each(_config.actions, function (i, opts) {
              var action = jQuery('<button name="' + opts.name + '" class="button-' + opts.name + '">' + opts.label + '</button>').button();
              action.on('click', function (e) {
                if (_story) {
                  opts.cb(e, _story, _self);
                } else {
                  opts.cb(e, _self);
                }

              });
              if (opts.className) {
                action.addClass(opts.className);
              }
              actions_holder.append(action);
            });
          }

          _item.on('click', function (e) {
            if (_config.callbacks.onClick) {
              _config.callbacks.onClick(e, _self);
            } else {
              if (!_story) {
                _self.close();
              }
            }
          });

          if (_config.auto_show) {
            this.show();
          }

          this._setPosition();

          _id = _midgardnotifications_active.push(this);

          _parent.append(_item);
        },
        
       _calculatePositionForGravity: function (item, gravity, target, itemDimensions) {
          item.find('.' + _classes.item.arrow).addClass(_classes.item.arrow + '_' + gravity);
          switch (gravity) {
          case 'TL':
            return {
              left: target.left,
              top: target.top + target.height + 'px'
            };
          case 'TR':
            return {
              left: target.left + target.width - itemDimensions.width + 'px',
              top: target.top + target.height + 'px'
            };
          case 'BL':
            return {
              left: target.left + 'px',
              top: target.top - itemDimensions.height + 'px'
            };
          case 'BR':
            return {
              left: target.left + target.width - itemDimensions.width + 'px',
              top: target.top - itemDimensions.height + 'px'
            };
          case 'LT':
            return {
              left: target.left + target.width + 'px',
              top: target.top + 'px'
            };
          case 'LB':
            return {
              left: target.left + target.width + 'px',
              top: target.top + target.height - itemDimensions.height + 'px'
            };
          case 'RT':
            return {
              left: target.left - itemDimensions.width + 'px',
              top: target.top + 'px'
            };
          case 'RB':
            return {
              left: target.left - itemDimensions.width + 'px',
              top: target.top + target.height - itemDimensions.height + 'px'
            };
          case 'T':
            return {
              left: target.left + target.width / 2 - itemDimensions.width / 2 + 'px',
              top: target.top + target.height + 'px'
            };
          case 'R':
            return {
              left: target.left - itemDimensions.width + 'px',
              top: target.top + target.height / 2 - itemDimensions.height / 2 + 'px'
            };
          case 'B':
            return {
              left: target.left + target.width / 2 - itemDimensions.width / 2 + 'px',
              top: target.top - itemDimensions.height + 'px'
            };
          case 'L':
            return {
              left: target.left + target.width + 'px',
              top: target.top + target.height / 2 - itemDimensions.height / 2 + 'px'
            };
          }
        },
        
        _isFixed: function (element) {
          if (element === document) {
            return false;
          }
          if (element.css('position') === 'fixed') {
            return true;
          }
          var parentElement = element.offsetParent();
          if (parentElement.get(0) === element.get(0)) {
            return false;
          }
          return this._isFixed(parentElement);
        },

        _setPosition: function () {
          var pos;
          if (_config.bindTo) {
            var itemDimensions = {
              width: _item.width() ? _item.width() : 280,
              height: _item.height() ? _item.height() : 109
            };
            
            _bind_target = jQuery(_config.bindTo);
            var properties = {};
            
            var targetDimensions = {
              width: _bind_target.outerWidth(),
              height: _bind_target.outerHeight()
            };
            
            if (this._isFixed(_bind_target)) {
              properties.position = 'fixed';
              targetDimensions.left = _bind_target.offset().left;
              targetDimensions.top = _bind_target.position().top;
            } else {
              properties.position = 'absolute';
              targetDimensions.left = _bind_target.offset().left;
              targetDimensions.top = _bind_target.offset().top;
            }
            
            pos = this._calculatePositionForGravity(_item, _config.gravity, targetDimensions, itemDimensions);
            properties.top = pos.top;
            properties.left = pos.left;

            _item.css(properties);

            return;
          }

          if (!_config.position) {
            _config.position = 'top right';
          }

          var marginTop = jQuery('.create-ui-toolbar-wrapper').outerHeight(true) + 6;
          pos = {
            position: 'fixed'
          };

          var item;
          var activeHeight = function (items) {
            var total_height = 0;
            jQuery.each(items, function (i, item) {
              if (!item) {
                return;
              }
              total_height += item.getElement().height();
            });
            return total_height;
          };

          if (_config.position.match(/top/)) {
            pos.top = marginTop + activeHeight(_midgardnotifications_active) + 'px';
          }
          if (_config.position.match(/bottom/)) {
            pos.bottom = (_midgardnotifications_active.length - 1 * item.height()) + item.height() + 10 + 'px';
          }
          if (_config.position.match(/right/)) {
            pos.right = 20 + 'px';
          }
          if (_config.position.match(/left/)) {
            pos.left = 20 + 'px';
          }

          _item.css(pos);
        },
        show: function () {
          var self = this;
          var w_t, w_b, b_b, b_t, e_t, e_h;

          if (_config.callbacks.beforeShow) {
            _config.callbacks.beforeShow(self);
          }

          if (_config.bindTo) {
            var _bind_target = jQuery(_config.bindTo);
            w_t = jQuery(window).scrollTop();
            w_b = jQuery(window).scrollTop() + jQuery(window).height();
            b_t = parseFloat(_item.offset().top, 10);
            e_t = _bind_target.offset().top;
            e_h = _bind_target.outerHeight();

            if (e_t < b_t) {
              b_t = e_t;
            }

            b_b = parseFloat(_item.offset().top, 10) + _item.height();
            if ((e_t + e_h) > b_b) {
              b_b = e_t + e_h;
            }
          }

          if (_config.timeout > 0 && !_config.actions.length) {
            window.setTimeout(function () {
              self.close();
            }, _config.timeout);
          }

          if (_config.bindTo && (b_t < w_t || b_t > w_b) || (b_b < w_t || b_b > w_b)) {
            jQuery('html, body').stop().animate({
              scrollTop: b_t
            }, 500, 'easeInOutExpo', function () {
              _config.effects.onShow(_item, function () {
                if (_config.callbacks.afterShow) {
                  _config.callbacks.afterShow(self);
                }
              });
            });
          } else {
            _config.effects.onShow(_item, function () {
              if (_config.callbacks.afterShow) {
                _config.callbacks.afterShow(self);
              }
            });
          }
        },
        close: function () {
          var self = this;
          if (_config.callbacks.beforeClose) {
            _config.callbacks.beforeClose(self);
          }
          _config.effects.onHide(_item, function () {
            if (_config.callbacks.afterClose) {
              _config.callbacks.afterClose(self);
            }
            self.destroy();
          });
        },
        destroy: function () {
          var self = this;
          jQuery.each(_midgardnotifications_active, function (i, item) {
            if (item) {
              if (item.getId() == self.getId()) {
                delete _midgardnotifications_active[i];
              }
            }
          });
          jQuery(_item).remove();
        },
        setStory: function (story) {
          _story = story;
        },
        setName: function (name) {
          _item.addClass(_classes.item.wrapper + '-custom-' + name);
          this.name = name;
        }
      };
      base.constructor(options);
      delete base.constructor;

      return base;
    };

  var MidgardNotificationStoryline = function (options, items) {
      var _defaults = {};
      var _config = {};
      var _storyline = {};
      var _current_notification = {};
      var _previous_item_name = null;
      var _first_item_name = null;
      var _last_item_name = null;
      var _current_item = null;

      var base = {
        constructor: function (options) {
          _config = _.extend(_defaults, options || {});
        },
        setStoryline: function (items) {
          var default_structure = {
            content: '',
            actions: [],
            show_actions: true,
            notification: {},
            // Notification options to override
            back: null,
            back_label: null,
            forward: null,
            forward_label: null,
            beforeShow: null,
            afterShow: null,
            beforeClose: null,
            afterClose: null
          };

          _storyline = {};
          _current_item = null;
          _previous_item_name = null;
          _first_item_name = null;
          _last_item_name = null;

          var self = this;

          jQuery.each(items, function (name, it) {
            var item = jQuery.extend({}, default_structure, it);
            item.name = name;
            var notification = jQuery.extend({}, default_structure.notification, it.notification || {});
            notification.body = item.content;

            notification.auto_show = false;
            if (item.actions.length) {
              notification.delay = 0;
            }
            notification.callbacks = {
              beforeShow: function (notif) {
                if (item.beforeShow) {
                  item.beforeShow(notif, self);
                }
              },
              afterShow: function (notif) {
                if (item.afterShow) {
                  item.afterShow(notif, self);
                }
              },
              beforeClose: function (notif) {
                if (item.beforeClose) {
                  item.beforeClose(notif, self);
                }
              },
              afterClose: function (notif) {
                if (item.afterClose) {
                  item.afterClose(notif, self);
                }
                _previous_item_name = notif.name;
              }
            };

            notification.actions = [];

            if (item.show_actions) {
              if (item.back) {
                var back_label = item.back_label;
                if (!back_label) {
                  back_label = 'Back';
                }
                notification.actions.push({
                  name: 'back',
                  label: back_label,
                  cb: function (e, story, notif) {
                    story.previous();
                  }
                });
              }

              if (item.forward) {
                var forward_label = item.forward_label;
                if (!forward_label) {
                  forward_label = 'Back';
                }
                notification.actions.push({
                  name: 'forward',
                  label: forward_label,
                  cb: function (e, story, notif) {
                    story.next();
                  }
                });
              }

              if (item.actions.length) {
                jQuery.each(item.actions, function (i, act) {
                  notification.actions.push(item.actions[i]);
                });
              }
            }

            if (!_first_item_name) {
              _first_item_name = name;
            }
            _last_item_name = name;

            item.notification = notification;

            _storyline[name] = item;
          });
          return _storyline;
        },
        start: function () {
          this._showNotification(_storyline[_first_item_name]);
        },
        stop: function () {
          _current_item.close();
          _current_item = null;
          _previous_item_name = null;
        },
        next: function () {
          _current_item.close();
          if (_storyline[_current_item.name].forward) {
            var next_item = _storyline[_current_item.name].forward;
            this._showNotification(_storyline[next_item]);
          } else {
            this._showNotification(_storyline[_last_item_name]);
          }
        },
        previous: function () {
          if (_previous_item_name) {
            _current_item.close();
            if (_storyline[_current_item.name].back) {
              var prev_item = _storyline[_current_item.name].back;
              this._showNotification(_storyline[prev_item]);
            } else {
              this._showNotification(_storyline[_previous_item_name]);
            }
          } else {
            this.stop();
          }
        },
        _showNotification: function (item) {
          _current_item = new MidgardNotification(jQuery('body'), item.notification);
          _current_item.setStory(this);
          _current_item.setName(item.name);
          _current_item.show();

          return _current_item;
        }
      };
      base.constructor(options);
      delete base.constructor;
      if (items) {
        base.setStoryline(items);
      }

      return base;
    };

  var _createTutorialStoryline = {
    'start': {
      content: 'Welcome to CreateJS tutorial!',
      forward: 'toolbar_toggle',
      forward_label: 'Start tutorial',
      actions: [{
        name: 'quit',
        label: 'Quit',
        cb: function (a, story, notif) {
          story.stop();
        }
      }]
    },
    'toolbar_toggle': {
      content: 'This is the CreateJS toolbars toggle button.<br />You can hide and show the full toolbar by clicking here.<br />Try it now.',
      forward: 'edit_button',
      show_actions: false,
      afterShow: function (notification, story) {
        jQuery('body').on('midgardtoolbarstatechange', function (event, options) {
          if (options.display == 'full') {
            story.next();
            jQuery('body').off('midgardtoolbarstatechange');
          }
        });
      },
      notification: {
        bindTo: '#midgard-bar-hidebutton',
        timeout: 0,
        gravity: 'TL'
      }
    },
    'edit_button': {
      content: 'This is the edit button.<br />Try it now.',
      show_actions: false,
      afterShow: function (notification, story) {
        jQuery('body').on('midgardcreatestatechange', function (event, options) {
          if (options.state == 'edit') {
            story.next();
            jQuery('body').off('midgardcreatestatechange');
          }
        });
      },
      notification: {
        bindTo: '.ui-button[for=midgardcreate-edit]',
        timeout: 0,
        gravity: 'TL'
      }
    },
    'end': {
      content: 'Thank you for watching!<br />Happy content editing times await you!'
    }
  };

  jQuery.widget('Midgard.midgardNotifications', {
    options: {
      notification_defaults: {
        class_prefix: 'midgardNotifications',
        position: 'top right'
      }
    },

    _create: function () {
      this.classes = {
        container: this.options.notification_defaults.class_prefix + '-container'
      };

      if (jQuery('.' + this.classes.container, this.element).length) {
        this.container = jQuery('.' + this.classes.container, this.element);
        this._parseFromDOM();
      } else {
        this.container = jQuery('<div class="' + this.classes.container + '" />');
        this.element.append(this.container);
      }
    },

    destroy: function () {
      this.container.remove();
      jQuery.Widget.prototype.destroy.call(this);
    },

    _init: function () {},

    _parseFromDOM: function (path) {

    },

    showStory: function (options, items) {
      var story = new MidgardNotificationStoryline(options, items);
      story.start();

      return story;
    },

    create: function (options) {
      options = jQuery.extend({}, this.options.notification_defaults, options || {});

      var item = new MidgardNotification(this.container, options);
      item.show();

      return item;
    },

    showTutorial: function () {
      this.showStory({}, _createTutorialStoryline);
    }
  });

})(jQuery);

(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false */
  'use strict';

  jQuery.widget('Midgard.midgardStorage', {
    saveEnabled: true,
    options: {
      // Whether to use localstorage
      localStorage: false,
      // String prefix for localStorage identifiers
      storagePrefix: '',
      removeLocalstorageOnIgnore: true,
      // VIE instance to use for storage handling
      vie: null,
      // URL callback for Backbone.sync
      url: '',
      // Whether to enable automatic saving
      autoSave: false,
      // How often to autosave in milliseconds
      autoSaveInterval: 5000,
      // Whether to save entities that are referenced by entities
      // we're saving to the server.
      saveReferencedNew: false,
      saveReferencedChanged: false,
      // Namespace used for events from midgardEditable-derived widget
      editableNs: 'midgardeditable',
      // CSS selector for the Edit button, leave to null to not bind
      // notifications to any element
      editSelector: '#midgardcreate-edit a',
      localize: function (id, language) {
        return window.midgardCreate.localize(id, language);
      },
      language: null
    },

    _create: function () {
      var widget = this;
      this.changedModels = [];

      if (window.localStorage) {
        this.options.localStorage = true;
      }

      this.vie = this.options.vie;

      this.vie.entities.on('add', function (model) {
        // Add the back-end URL used by Backbone.sync
        model.url = widget.options.url;
        model.toJSON = model.toJSONLD;
      });

      widget._bindEditables();
      if (widget.options.autoSave) {
        widget._autoSave();
      }
    },

    _autoSave: function () {
      var widget = this;
      widget.saveEnabled = true;

      var doAutoSave = function () {
        if (!widget.saveEnabled) {
          return;
        }

        if (widget.changedModels.length === 0) {
          return;
        }

        widget.saveRemoteAll({
          // We make autosaves silent so that potential changes from server
          // don't disrupt user while writing.
          silent: true
        });
      };

      var timeout = window.setInterval(doAutoSave, widget.options.autoSaveInterval);

      this.element.on('startPreventSave', function () {
        if (timeout) {
          window.clearInterval(timeout);
          timeout = null;
        }
        widget.disableAutoSave();
      });
      this.element.on('stopPreventSave', function () {
        if (!timeout) {
          timeout = window.setInterval(doAutoSave, widget.options.autoSaveInterval);
        }
        widget.enableAutoSave();
      });

    },

    enableAutoSave: function () {
      this.saveEnabled = true;
    },

    disableAutoSave: function () {
      this.saveEnabled = false;
    },

    _bindEditables: function () {
      var widget = this;
      this.restorables = [];
      var restorer;

      widget.element.on(widget.options.editableNs + 'changed', function (event, options) {
        if (_.indexOf(widget.changedModels, options.instance) === -1) {
          widget.changedModels.push(options.instance);
          options.instance.midgardStorageVersion = 1;
        } else {
          options.instance.midgardStorageVersion++;
        }
        widget._saveLocal(options.instance);
      });

      widget.element.on(widget.options.editableNs + 'disable', function (event, options) {
        widget.revertChanges(options.instance);
      });

      widget.element.on(widget.options.editableNs + 'enable', function (event, options) {
        if (!options.instance._originalAttributes) {
          options.instance._originalAttributes = _.clone(options.instance.attributes);
        }

        if (!options.instance.isNew() && widget._checkLocal(options.instance)) {
          // We have locally-stored modifications, user needs to be asked
          widget.restorables.push(options.instance);
        }

        /*_.each(options.instance.attributes, function (attributeValue, property) {
          if (attributeValue instanceof widget.vie.Collection) {
            widget._readLocalReferences(options.instance, property, attributeValue);
          }
        });*/
      });

      widget.element.on('midgardcreatestatechange', function (event, options) {
        if (options.state === 'browse' || widget.restorables.length === 0) {
          widget.restorables = [];
          if (restorer) {
            restorer.close();
          }
          return;
        }
        restorer = widget.checkRestore();
      });

      widget.element.on('midgardstorageloaded', function (event, options) {
        if (_.indexOf(widget.changedModels, options.instance) === -1) {
          widget.changedModels.push(options.instance);
        }
      });
    },

    checkRestore: function () {
      var widget = this;
      if (widget.restorables.length === 0) {
        return;
      }

      var message;
      var restorer;
      if (widget.restorables.length === 1) {
        message = _.template(widget.options.localize('localModification', widget.options.language), {
          label: widget.restorables[0].getSubjectUri()
        });
      } else {
        message = _.template(widget.options.localize('localModifications', widget.options.language), {
          number: widget.restorables.length
        });
      }

      var doRestore = function (event, notification) {
        widget.restoreLocalAll();
        restorer.close();
      };

      var doIgnore = function (event, notification) {
        widget.ignoreLocal();
        restorer.close();
      };

      restorer = jQuery('body').midgardNotifications('create', {
        bindTo: widget.options.editSelector,
        gravity: 'TR',
        body: message,
        timeout: 0,
        actions: [
          {
            name: 'restore',
            label: widget.options.localize('Restore', widget.options.language),
            cb: doRestore,
            className: 'create-ui-btn'
          },
          {
            name: 'ignore',
            label: widget.options.localize('Ignore', widget.options.language),
            cb: doIgnore,
            className: 'create-ui-btn'
          }
        ],
        callbacks: {
          beforeShow: function () {
            if (!window.Mousetrap) {
              return;
            }
            window.Mousetrap.bind(['command+shift+r', 'ctrl+shift+r'], function (event) {
              event.preventDefault();
              doRestore();
            });
            window.Mousetrap.bind(['command+shift+i', 'ctrl+shift+i'], function (event) {
              event.preventDefault();
              doIgnore();
            });
          },
          afterClose: function () {
            if (!window.Mousetrap) {
              return;
            }
            window.Mousetrap.unbind(['command+shift+r', 'ctrl+shift+r']);
            window.Mousetrap.unbind(['command+shift+i', 'ctrl+shift+i']);
          }
        }
      });
      return restorer;
    },

    restoreLocalAll: function () {
      _.each(this.restorables, function (instance) {
        this.readLocal(instance);
      }, this);
      this.restorables = [];
    },

    ignoreLocal: function () {
      if (this.options.removeLocalstorageOnIgnore) {
        _.each(this.restorables, function (instance) {
          this._removeLocal(instance);
        }, this);
      }
      this.restorables = [];
    },

    saveReferences: function (model) {
      _.each(model.attributes, function (value, property) {
        if (!value || !value.isCollection) {
          return;
        }

        value.each(function (referencedModel) {
          if (this.changedModels.indexOf(referencedModel) !== -1) {
            // The referenced model is already in the save queue
            return;
          }

          if (referencedModel.isNew() && this.options.saveReferencedNew) {
            return referencedModel.save();
          }

          if (referencedModel.hasChanged() && this.options.saveReferencedChanged) {
            return referencedModel.save();
          }
        }, this);
      }, this);
    },

    saveRemote: function (model, options) {
      // Optionally handle entities referenced in this model first
      this.saveReferences(model);

      this._trigger('saveentity', null, {
        entity: model,
        options: options
      });

      var widget = this,
          previousVersion = model.midgardStorageVersion;
      model.save(null, _.extend({}, options, {
        success: function (m, response) {
          // From now on we're going with the values we have on server
          model._originalAttributes = _.clone(model.attributes);
          widget._removeLocal(model);
          window.setTimeout(function () {
            // Remove the model from the list of changed models after saving if no other change was made to the model
            if (model.midgardStorageVersion == previousVersion) {
              widget.changedModels.splice(widget.changedModels.indexOf(model), 1);
            }
          }, 0);
          if (_.isFunction(options.success)) {
            options.success(m, response);
          }
          widget._trigger('savedentity', null, {
            entity: model,
            options: options
          });
        },
        error: function (m, response) {
          if (_.isFunction(options.error)) {
            options.error(m, response);
          }
        }
      }));
    },

    saveRemoteAll: function (options) {
      var widget = this;
      if (widget.changedModels.length === 0) {
        return;
      }

      widget._trigger('save', null, {
        entities: widget.changedModels,
        options: options,
        // Deprecated
        models: widget.changedModels
      });

      var notification_msg;
      var needed = widget.changedModels.length;
      if (needed > 1) {
        notification_msg = _.template(widget.options.localize('saveSuccessMultiple', widget.options.language), {
          number: needed
        });
      } else {
        notification_msg = _.template(widget.options.localize('saveSuccess', widget.options.language), {
          label: widget.changedModels[0].getSubjectUri()
        });
      }

      widget.disableAutoSave();
      _.each(widget.changedModels, function (model) {
        this.saveRemote(model, {
          success: function (m, response) {
            needed--;
            if (needed <= 0) {
              // All models were happily saved
              widget._trigger('saved', null, {
                options: options
              });
              if (options && _.isFunction(options.success)) {
                options.success(m, response);
              }
              jQuery('body').midgardNotifications('create', {
                body: notification_msg
              });
              widget.enableAutoSave();
            }
          },
          error: function (m, err) {
            if (options && _.isFunction(options.error)) {
              options.error(m, err);
            }
            jQuery('body').midgardNotifications('create', {
              body: _.template(widget.options.localize('saveError', widget.options.language), {
                error: err.responseText || ''
              }),
              timeout: 0
            });

            widget._trigger('error', null, {
              instance: model
            });
          }
        });
      }, this);
    },

    _saveLocal: function (model) {
      if (!this.options.localStorage) {
        return;
      }

      if (model.isNew()) {
        // Anonymous object, save as refs instead
        if (!model.primaryCollection) {
          return;
        }
        return this._saveLocalReferences(model.primaryCollection.subject, model.primaryCollection.predicate, model);
      }
      var key = this.options.storagePrefix + model.getSubjectUri();
      window.localStorage.setItem(key, JSON.stringify(model.toJSONLD()));
    },

    _getReferenceId: function (model, property) {
      return model.id + ':' + property;
    },

    _saveLocalReferences: function (subject, predicate, model) {
      if (!this.options.localStorage) {
        return;
      }

      if (!subject || !predicate) {
        return;
      }

      var widget = this;
      var identifier = this.options.storagePrefix + subject + ':' + predicate;
      var json = model.toJSONLD();
      if (window.localStorage.getItem(identifier)) {
        var referenceList = JSON.parse(window.localStorage.getItem(identifier));
        var index = _.pluck(referenceList, '@').indexOf(json['@']);
        if (index !== -1) {
          referenceList[index] = json;
        } else {
          referenceList.push(json);
        }
        window.localStorage.setItem(identifier, JSON.stringify(referenceList));
        return;
      }
      window.localStorage.setItem(identifier, JSON.stringify([json]));
    },

    _checkLocal: function (model) {
      if (!this.options.localStorage) {
        return false;
      }

      var key = this.options.storagePrefix + model.getSubjectUri();
      var local = window.localStorage.getItem(key);
      if (!local) {
        return false;
      }

      return true;
    },

    hasLocal: function (model) {
      if (!this.options.localStorage) {
        return false;
      }
      var key = this.options.storagePrefix + model.getSubjectUri();
      if (!window.localStorage.getItem(key)) {
        return false;
      }
      return true;
    },

    readLocal: function (model) {
      if (!this.options.localStorage) {
        return;
      }

      var key = this.options.storagePrefix + model.getSubjectUri();
      var local = window.localStorage.getItem(key);
      if (!local) {
        return;
      }
      if (!model._originalAttributes) {
        model._originalAttributes = _.clone(model.attributes);
      }
      var parsed = JSON.parse(local);
      var entity = this.vie.entities.addOrUpdate(parsed, {
        overrideAttributes: true
      });

      this._trigger('loaded', null, {
        instance: entity
      });
    },

    _readLocalReferences: function (model, property, collection) {
      if (!this.options.localStorage) {
        return;
      }

      var identifier = this.options.storagePrefix + this._getReferenceId(model, property);
      var local = window.localStorage.getItem(identifier);
      if (!local) {
        return;
      }
      collection.add(JSON.parse(local));
    },

    revertChanges: function (model) {
      var widget = this;

      // Remove unsaved collection members
      if (!model) { return; }
      _.each(model.attributes, function (attributeValue, property) {
        if (attributeValue instanceof widget.vie.Collection) {
          var removables = [];
          attributeValue.forEach(function (model) {
            if (model.isNew()) {
              removables.push(model);
            }
          });
          attributeValue.remove(removables);
        }
      });

      // Restore original object properties
      if (!model.changedAttributes()) {
        if (model._originalAttributes) {
          model.set(model._originalAttributes);
        }
        return;
      }

      model.set(model.previousAttributes());
    },

    _removeLocal: function (model) {
      if (!this.options.localStorage) {
        return;
      }
      var key = this.options.storagePrefix + model.getSubjectUri();
      window.localStorage.removeItem(key);
    }
  });
})(jQuery);

(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false */
  'use strict';

  jQuery.widget('Midgard.midgardToolbar', {
    options: {
      display: 'full',
      templates: {
        minimized: '<div class="create-ui-logo"><a class="create-ui-toggle" id="create-ui-toggle-toolbar"></a></div>',
        full: '<div class="create-ui-toolbar-wrapper"><div class="create-ui-toolbar-toolarea"><%= dynamic %><%= status %></div></div>',
        toolcontainer: '<div class="create-ui-toolbar-<%= name %>toolarea"><ul class="create-ui-<%= name %>tools"><%= content %></ul></div>',
        toolarea: '<li class="create-ui-tool-<%= name %>area"></li>'
      }
    },

    _create: function () {
      this.element.append(this._getMinimized());
      this.element.append(this._getFull());

      var widget = this;
      jQuery('.create-ui-toggle', this.element).click(function () {
        if (widget.options.display === 'full') {
          widget.setDisplay('minimized');
        } else {
          widget.setDisplay('full');
        }
      });

      jQuery(this.element).on('midgardcreatestatechange', function (event, options) {
        if (options.state == 'browse') {
          widget._clearWorkflows();
        }
      });

      jQuery(this.element).on('midgardworkflowschanged', function (event, options) {
        widget._clearWorkflows();
        if (options.workflows.length) {
          options.workflows.each(function (workflow) {
            var workflowsInstance = jQuery('body').data('Midgard-midgardWorkflows');
            if (!workflowsInstance) {
              // pre-1.10 jQuery UI
              workflowsInstance = jQuery('body').data('midgardWorkflows');
            }
            var html = workflowsInstance.prepareItem(options.instance, workflow, function (err, model) {
              widget._clearWorkflows();
              if (err) {
                return;
              }
            });
            jQuery('.create-ui-tool-workflowarea', widget.element).append(html);
          });
        }
      });
    },

    _init: function () {
      this.setDisplay(this.options.display);
    },

    setDisplay: function (value) {
      if (value === this.options.display) {
        return;
      }
      if (value === 'minimized') {
        this.hide();
        this.options.display = 'minimized';
      } else {
        this.show();
        this.options.display = 'full';
      }
      this._trigger('statechange', null, this.options);
    },

    hide: function () {
      jQuery('div.create-ui-toolbar-wrapper').fadeToggle('fast', 'linear');
    },

    show: function () {
      jQuery('div.create-ui-toolbar-wrapper').fadeToggle('fast', 'linear');
    },

    _getMinimized: function () {
      return jQuery(_.template(this.options.templates.minimized, {}));
    },

    _getFull: function () {
      return jQuery(_.template(this.options.templates.full, {
        dynamic: _.template(this.options.templates.toolcontainer, {
          name: 'dynamic',
          content:
            _.template(this.options.templates.toolarea, {
              name: 'metadata'
            }) +
            _.template(this.options.templates.toolarea, {
              name: 'workflow'
            }) +
            _.template(this.options.templates.toolarea, {
              name: 'free'
            })
        }),
        status: _.template(this.options.templates.toolcontainer, {
          name: 'status',
          content: ''
        })
      }));
    },

    _clearWorkflows: function () {
      jQuery('.create-ui-tool-workflowarea', this.element).empty();
    }
  });
})(jQuery);

(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false Backbone:false */
  'use strict';

  jQuery.widget('Midgard.midgardWorkflows', {
    options: {
      url: function (model) {},
      templates: {
        button: '<button class="create-ui-btn" id="<%= id %>"><%= label %></button>'
      },
      renderers: {
        button: function (model, workflow, action_cb, final_cb) {
          var button_id = 'midgardcreate-workflow_' + workflow.get('name');
          var html = jQuery(_.template(this.options.templates.button, {
            id: button_id,
            label: workflow.get('label')
          })).button();

          html.on('click', function (evt) {
            action_cb(model, workflow, final_cb);
          });
          return html;
        }
      },
      action_types: {
        backbone_save: function (model, workflow, callback) {
          var copy_of_url = model.url;
          var original_model = model.clone();
          original_model.url = copy_of_url;

          var action = workflow.get('action');
          if (action.url) {
            model.url = action.url;
          }
          original_model.save(null, {
            success: function (m) {
              model.url = copy_of_url;
              model.change();
              callback(null, model);
            },
            error: function (m, err) {
              model.url = copy_of_url;
              model.change();
              callback(err, model);
            }
          });
        },
        backbone_destroy: function (model, workflow, callback) {
          var copy_of_url = model.url;
          var original_model = model.clone();
          original_model.url = copy_of_url;

          var action = workflow.get('action');
          if (action.url) {
            model.url = action.url;
          }

          model.destroy({
            success: function (m) {
              model.url = copy_of_url;
              model.change();
              callback(null, m);
            },
            error: function (m, err) {
              model.url = copy_of_url;
              model.change();
              callback(err, model);
            }
          });
        },
        http: function (model, workflow, callback) {
          var action = workflow.get('action');
          if (!action.url) {
            return callback('No action url defined!');
          }

          var wf_opts = {};
          if (action.http) {
            wf_opts = action.http;
          }

          var ajax_options = jQuery.extend({
            url: action.url,
            type: 'POST',
            data: model.toJSON(),
            success: function () {
              model.fetch({
                success: function (model) {
                  callback(null, model);
                },
                error: function (model, err) {
                  callback(err, model);
                }
              });
            }
          }, wf_opts);

          jQuery.ajax(ajax_options);
        }
      }
    },

    _init: function () {
      this._renderers = {};
      this._action_types = {};

      this._parseRenderersAndTypes();

      this._last_instance = null;

      this.ModelWorkflowModel = Backbone.Model.extend({
        defaults: {
          name: '',
          label: '',
          type: 'button',
          action: {
            type: 'backbone_save'
          }
        }
      });

      this.workflows = {};

      var widget = this;
      jQuery(this.element).on('midgardeditableactivated', function (event, options) {
        widget._fetchWorkflows(options.instance);
      });
    },

    _fetchWorkflows: function (model) {
      var widget = this;
      if (model.isNew()) {
        widget._trigger('changed', null, {
          instance: model,
          workflows: []
        });
        return;
      }

      if (widget._last_instance == model) {
        if (widget.workflows[model.cid]) {
          widget._trigger('changed', null, {
            instance: model,
            workflows: widget.workflows[model.cid]
          });
        }
        return;
      }
      widget._last_instance = model;

      if (widget.workflows[model.cid]) {
        widget._trigger('changed', null, {
          instance: model,
          workflows: widget.workflows[model.cid]
        });
        return;
      }

      if (widget.options.url) {
        widget._fetchModelWorkflows(model);
      } else {
        var flows = new(widget._generateCollectionFor(model))([], {});
        widget._trigger('changed', null, {
          instance: model,
          workflows: flows
        });
      }
    },

    _parseRenderersAndTypes: function () {
      var widget = this;
      jQuery.each(this.options.renderers, function (k, v) {
        widget.setRenderer(k, v);
      });
      jQuery.each(this.options.action_types, function (k, v) {
        widget.setActionType(k, v);
      });
    },

    setRenderer: function (name, callbacks) {
      this._renderers[name] = callbacks;
    },
    getRenderer: function (name) {
      if (!this._renderers[name]) {
        return false;
      }

      return this._renderers[name];
    },
    setActionType: function (name, callback) {
      this._action_types[name] = callback;
    },
    getActionType: function (name) {
      return this._action_types[name];
    },

    prepareItem: function (model, workflow, final_cb) {
      var widget = this;

      var renderer = this.getRenderer(workflow.get("type"));
      var action_type_cb = this.getActionType(workflow.get("action").type);

      return renderer.call(this, model, workflow, action_type_cb, function (err, m) {
        delete widget.workflows[model.cid];
        widget._last_instance = null;
        if (workflow.get('action').type !== 'backbone_destroy') {
          // Get an updated list of workflows
          widget._fetchModelWorkflows(model);
        }
        final_cb(err, m);
      });
    },

    _generateCollectionFor: function (model) {
      var collectionSettings = {
        model: this.ModelWorkflowModel
      };
      if (this.options.url) {
        collectionSettings.url = this.options.url(model);
      }
      return Backbone.Collection.extend(collectionSettings);
    },

    _fetchModelWorkflows: function (model) {
      if (model.isNew()) {
        return;
      }
      var widget = this;

      widget.workflows[model.cid] = new(this._generateCollectionFor(model))([], {});
      widget.workflows[model.cid].fetch({
        success: function (collection) {
          widget.workflows[model.cid].reset(collection.models);

          widget._trigger('changed', null, {
            instance: model,
            workflows: widget.workflows[model.cid]
          });
        },
        error: function (model, err) {
          //console.log('error fetching flows', err);
        }
      });
    }
  });
})(jQuery);

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}

window.midgardCreate.localize = function (id, language) {
  if (!window.midgardCreate.locale) {
    // No localization files loaded, return as-is
    return id;
  }
  if (window.midgardCreate.locale[language] && window.midgardCreate.locale[language][id]) {
    return window.midgardCreate.locale[language][id];
  }
  if (window.midgardCreate.locale.en[id]) {
    return window.midgardCreate.locale.en[id];
  }
  return id;
};

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

(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false console:false */
  'use strict';

  // # Widget for adding items anywhere inside a collection
  jQuery.widget('Midgard.midgardCollectionAddBetween', jQuery.Midgard.midgardCollectionAdd, {
    _bindCollectionView: function (view) {
      var widget = this;
      view.on('add', function (itemView) {
        //itemView.el.effect('slide');
        widget._makeEditable(itemView);
        widget._refreshButtons();
      });
      view.on('remove', function () {
        widget._refreshButtons();
      });
    },

    _refreshButtons: function () {
      var widget = this;
      window.setTimeout(function () {
        widget.disable();
        widget.enable();
      }, 1);
    },

    prepareButton: function (index) {
      var widget = this;
      var addButton = jQuery(_.template(this.options.templates.button, {
        icon: 'plus',
        label: ''
      })).button();
      addButton.addClass('midgard-create-add');
      addButton.click(function () {
        widget.addItem(addButton, {
          at: index
        });
      });
      return addButton;
    },

    enable: function () {
      var widget = this;

      var firstAddButton = widget.prepareButton(0);
      jQuery(widget.options.view.el).prepend(firstAddButton);
      widget.addButtons.push(firstAddButton);
      jQuery.each(widget.options.view.entityViews, function (cid, view) {
        var index = widget.options.collection.indexOf(view.model);
        var addButton = widget.prepareButton(index + 1);
        jQuery(view.el).append(addButton);
        widget.addButtons.push(addButton);
      });

      this.checkCollectionConstraints();
    },

    disable: function () {
      var widget = this;
      jQuery.each(widget.addButtons, function (idx, button) {
        button.remove();
      });
      widget.addButtons = [];
    }
  });
})(jQuery);

(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false document:false */
  'use strict';

  // # Base property editor widget
  //
  // This property editor widget provides a very simplistic `contentEditable`
  // property editor that can be used as standalone, but should more usually be
  // used as the base class for other property editor widgets.
  // This property editor widget is only useful for textual properties!
  //
  // Subclassing this base property editor widget is easy:
  //
  //     jQuery.widget('Namespace.MyWidget', jQuery.Create.editWidget, {
  //       // override any properties
  //     });
  jQuery.widget('Midgard.editWidget', {
    options: {
      disabled: false,
      vie: null
    },
    // override to enable the widget
    enable: function () {
      this.element.attr('contenteditable', 'true');
    },
    // override to disable the widget
    disable: function (disable) {
      this.element.attr('contenteditable', 'false');
    },
    // called by the jQuery UI plugin factory when creating the property editor
    // widget instance
    _create: function () {
      this._registerWidget();
      this._initialize();

      if (_.isFunction(this.options.decorate) && _.isFunction(this.options.decorateParams)) {
        // TRICKY: we can't use this.options.decorateParams()'s 'propertyName'
        // parameter just yet, because it will only be available after this
        // object has been created, but we're currently in the constructor!
        // Hence we have to duplicate part of its logic here.
        this.options.decorate(this.options.decorateParams(null, {
          propertyName: this.options.property,
          propertyEditor: this,
          propertyElement: this.element,
          // Deprecated.
          editor: this,
          predicate: this.options.property,
          element: this.element
        }));
      }
    },
    // called every time the property editor widget is called
    _init: function () {
      if (this.options.disabled) {
        this.disable();
        return;
      }
      this.enable();
    },
    // override this function to initialize the property editor widget functions
    _initialize: function () {
      var self = this;
      this.element.on('focus', function () {
        if (self.options.disabled) {
          return;
        }
        self.options.activated();
      });
      this.element.on('blur', function () {
        if (self.options.disabled) {
          return;
        }
        self.options.deactivated();
      });
      var before = this.element.text();
      this.element.on('keyup paste', function (event) {
        if (self.options.disabled) {
          return;
        }
        var current = jQuery(this).text();
        if (before !== current) {
          before = current;
          self.options.changed(current);
        }
      });
    },
    // used to register the property editor widget name with the DOM element
    _registerWidget: function () {
      this.element.data("createWidgetName", this.widgetName);
    }
  });
})(jQuery);

(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false document:false Aloha:false */
  'use strict';

  // # Aloha editing widget
  //
  // This widget allows editing textual contents using the
  // [Aloha](http://aloha-editor.org) rich text editor.
  //
  // Due to licensing incompatibilities, Aloha Editor needs to be installed
  // and configured separately.
  jQuery.widget('Midgard.alohaWidget', jQuery.Midgard.editWidget, {
    _initialize: function () {},
    enable: function () {
      var options = this.options;
      var editable;
      var currentElement = Aloha.jQuery(options.element.get(0)).aloha();
      _.each(Aloha.editables, function (aloha) {
        // Find the actual editable instance so we can hook to the events
        // correctly
        if (aloha.obj.get(0) === currentElement.get(0)) {
          editable = aloha;
        }
      });
      if (!editable) {
        return;
      }
      editable.vieEntity = options.entity;

      var checkEditableChanged;

      function activeEditableChanged() {
        if (Aloha.activeEditable.isModified()) {
          options.changed(Aloha.activeEditable.getContents());
          Aloha.activeEditable.setUnmodified();
        }
      }

      // Subscribe to activation and deactivation events
      Aloha.bind('aloha-editable-activated', function (event, data) {
        if (data.editable !== editable) {
          return;
        }
        checkEditableChanged = window.setInterval(activeEditableChanged, 500);
        options.activated();
      });
      Aloha.bind('aloha-editable-deactivated', function (event, data) {
        if (data.editable !== editable) {
          return;
        }
        window.clearInterval(checkEditableChanged);
        options.deactivated();
      });

      Aloha.bind('aloha-smart-content-changed', function (event, data) {
        if (data.editable !== editable) {
          return;
        }
        if (!data.editable.isModified()) {
          return true;
        }
        options.changed(data.editable.getContents());
        data.editable.setUnmodified();
      });
      this.options.disabled = false;
    },
    disable: function () {
      Aloha.jQuery(this.options.element.get(0)).mahalo();
      this.options.disabled = true;
    }
  });
})(jQuery);

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
        if (widget.options.editorOptions !== undefined) {
          jQuery.each(widget.options.editorOptions, function(optionName, option) {
            widget.editor.config[optionName] = option;
          });
        }
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

(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false document:false */
  'use strict';

  // # Hallo editing widget
  //
  // This widget allows editing textual content areas with the
  // [Hallo](http://hallojs.org) rich text editor.
  jQuery.widget('Midgard.halloWidget', jQuery.Midgard.editWidget, {
    options: {
      editorOptions: {},
      disabled: true,
      toolbarState: 'full',
      vie: null,
      entity: null
    },
    enable: function () {
      jQuery(this.element).hallo({
        editable: true
      });
      this.options.disabled = false;
    },

    disable: function () {
      jQuery(this.element).hallo({
        editable: false
      });
      this.options.disabled = true;
    },

    _initialize: function () {
      jQuery(this.element).hallo(this.getHalloOptions());
      var self = this;
      jQuery(this.element).on('halloactivated', function (event, data) {
        self.options.activated();
      });
      jQuery(this.element).on('hallodeactivated', function (event, data) {
        self.options.deactivated();
      });
      jQuery(this.element).on('hallomodified', function (event, data) {
        self.options.changed(data.content);
        data.editable.setUnmodified();
      });

      jQuery(document).on('midgardtoolbarstatechange', function(event, data) {
        // Switch between Hallo configurations when toolbar state changes
        if (data.display === self.options.toolbarState) {
          return;
        }
        self.options.toolbarState = data.display;
        if (!self.element.data('IKS-hallo') && !self.element.data('hallo')) {
          // Hallo not yet instantiated
          return;
        }
        var newOptions = self.getHalloOptions();
        self.element.hallo('changeToolbar', newOptions.parentElement, newOptions.toolbar, true);
      });
    },

    getHalloOptions: function() {
      var defaults = {
        plugins: {
          halloformat: {},
          halloblock: {},
          hallolists: {},
          hallolink: {},
          halloimage: {
            entity: this.options.entity
          }
        },
        buttonCssClass: 'create-ui-btn-small',
        placeholder: '[' + this.options.property + ']'
      };

      if (typeof this.element.annotate === 'function' && this.options.vie.services.stanbol) {
        // Enable Hallo Annotate plugin by default if user has annotate.js
        // loaded and VIE has Stanbol enabled
        defaults.plugins.halloannotate = {
            vie: this.options.vie
        };
      }

      if (this.options.toolbarState === 'full') {
        // Use fixed toolbar in the Create tools area
        defaults.parentElement = jQuery('.create-ui-toolbar-dynamictoolarea .create-ui-tool-freearea');
        defaults.toolbar = 'halloToolbarFixed';
      } else {
        // Tools area minimized, use floating toolbar
        defaults.parentElement = 'body';
        defaults.toolbar = 'halloToolbarContextual';
      }
      return _.extend(defaults, this.options.editorOptions);
    }
  });
})(jQuery);

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

(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false document:false */
  'use strict';

  // # Redactor editing widget
  //
  // This widget allows editing textual content areas with the
  // [Redactor](http://redactorjs.com/) rich text editor.
  jQuery.widget('Midgard.redactorWidget', jQuery.Midgard.editWidget, {
    editor: null,

    options: {
      editorOptions: {},
      disabled: true
    },

    enable: function () {
      jQuery(this.element).redactor(this.getRedactorOptions());
      this.options.disabled = false;
    },

    disable: function () {
      jQuery(this.element).destroyEditor();
      this.options.disabled = true;
    },

    _initialize: function () {
      var self = this;
      jQuery(this.element).on('focus', function (event) {
        self.options.activated(); 
      });
      /*
      jQuery(this.element).on('blur', function (event) {
        self.options.deactivated(); 
      });
      */
    },

    getRedactorOptions: function () {
      var self = this;
      var overrides = {
        keyupCallback: function (obj, event) {
          self.options.changed(jQuery(self.element).getCode());
        },
        execCommandCallback: function (obj, command) {
          self.options.changed(jQuery(self.element).getCode());
        }
      };

      return _.extend(self.options.editorOptions, overrides);
    }
  });
})(jQuery);

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

(function (jQuery, undefined) {
    /*global OpenLayers:false */
    // Run JavaScript in strict mode
    'use strict';

    // This widget allows editing geocoordinates with the help of openlayers
    // and per default layer OSM
    jQuery.widget('Midgard.midgardGeo', {
        options:{
            layer:null,
            map:null,
            coordSystem:'EPSG:4326',
            defaultCenter: null,
            defaultZoomLevel: 3,
            geoProperty: 'http://schema.org/geo',
            geoCoordinateType: 'http://schema.org/GeoCoordinates',
            geoLonProperty: 'http://schema.org/longitude',
            geoLatProperty: 'http://schema.org/latitude',
            marker: {
                url: 'http://www.openlayers.org/dev/img/marker.png',
                size: {w:21, h:25},
                offset: {w:-10, h:-25} //-(size.w / 2), -size.h
            }
        },
        data : {},
        coordsObj : null,

        /**
         * activate mapwidget
         *
         * @param data
         */
        activate: function (data) {
            this.data = data;
            this.coordsObj = null;

            var geo = this.data.entity.get(this.options.geoProperty);

            if(_.isUndefined(geo)) {
                var types = this.data.entity.attributes['@type'];
                if(!_.isArray(types)) {
                    types = [types];
                }

                if(_.indexOf(types, '<' + this.options.geoCoordinateType + '>') > 0) {
                    this.coordsObj = this.data.entity;
                }
            } else {
                this.coordsObj = geo.models[0];
            }

            if(_.isNull(this.coordsObj)){
                this.element.hide();
                return;
            } else {
                this.element.show();
            }


            var lat = parseFloat(this.coordsObj.get(this.options.geoLatProperty)),
                lon = parseFloat(this.coordsObj.get(this.options.geoLonProperty));

            this.centerMap(lon, lat);
        },

        /**
         * create the map object
         *
         * @private
         */
        _createMap: function() {
            if (!_.isNull(this.options.map)) {
                return;
            }
            var that = this,
                mapDiv = jQuery('<div>', {
                id:'midgardGeoMap',
                style:"height:200px; width:300px"
            });
            this.element.append(mapDiv);
            this.options.map = new OpenLayers.Map('midgardGeoMap');


            if (_.isNull(this.options.layer)) {
                this.options.layer = new OpenLayers.Layer.OSM("OSM");
            }

            this.options.map.addLayer(this.options.layer);

            this.options.markers = new OpenLayers.Layer.Markers("Markers");
            this.options.map.addLayer(this.options.markers);


            OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
                defaultHandlerOptions:{
                    'single':true,
                    'double':false,
                    'pixelTolerance':0,
                    'stopSingle':false,
                    'stopDouble':false
                },

                initialize:function (options) {
                    this.handlerOptions = OpenLayers.Util.extend(
                        {}, this.defaultHandlerOptions
                    );
                    OpenLayers.Control.prototype.initialize.apply(
                        this, arguments
                    );
                    this.handler = new OpenLayers.Handler.Click(
                        this, {
                            'click':function (e) {
                                that.mapClick(e);
                            }
                        }, this.handlerOptions
                    );
                }
            });


            var click = new OpenLayers.Control.Click();
            this.options.map.addControl(click);
            click.activate();

            var center  = this.options.defaultCenter.clone();
            center.transform(
                new OpenLayers.Projection(this.options.coordSystem),
                this.options.map.getProjectionObject()
            );

            this.options.map.setCenter(
                center, this.options.defaultZoomLevel
            );
        },

        mapClick:function (e) {
            var lonlat = this.options.map.getLonLatFromPixel(e.xy);
            lonlat.transform(this.options.map.getProjectionObject(), new OpenLayers.Projection(this.options.coordSystem));

            var panTo = lonlat.clone();
            this.centerMap(panTo.lon, panTo.lat);
            this.setCoordinates(lonlat.lat, lonlat.lon);
        },

        disable:function () {

        },

        /**
         * set coordinates to the model
         *
         * @param lat
         * @param lon
         */
        setCoordinates:function (lat, lon) {
            var geo = this.data.entity.get(this.options.geoProperty),
                coordsModel = geo.models[0];

            coordsModel.set(this.options.geoLatProperty, lat);
            coordsModel.set(this.options.geoLonProperty, lon);
        },

        /**
         * widget init
         *
         * @private
         */
        _init:function () {
            this.element.hide();
            this.element.append( jQuery('<h3>GEO</h3>') );
            if(_.isNull(this.options.defaultCenter)){
                this.options.defaultCenter = new OpenLayers.LonLat(0, 0);
            }
            this._createMap();
        },

        /**
         * coordinates should be given in the default coordiante system from config
         *
         * @param lon
         * @param lat
         */
        centerMap:function (lon, lat) {
            var center = new OpenLayers.LonLat(lon, lat).transform(
                    new OpenLayers.Projection(this.options.coordSystem),
                    this.options.map.getProjectionObject()
                );

            if (this.options.centermark) {
                this.options.centermark.destroy();
            }

            var size = new OpenLayers.Size(
                this.options.marker.size.w ,
                this.options.marker.size.h
            );
            var offset = new OpenLayers.Pixel(
                this.options.marker.offset.w ,
                this.options.marker.offset.h
            );
            var icon = new OpenLayers.Icon(this.options.marker.url, size, offset);
            this.options.centermark = new OpenLayers.Marker(center, icon);
            this.options.markers.addMarker(this.options.centermark);

            this.options.map.panTo(center);
        }
    });
})(jQuery);

(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false */
  'use strict';

  jQuery.widget('Midgard.midgardTags', {
    enhanced: false,

    options: {
      predicate: 'skos:related',
      vie: null,
      templates: {
        tags: '<div class="create-ui-tags <%= type %>Tags"><h3><%= label %></h3><input type="text" class="tags" value="" /></div>'
      },
      localize: function (id, language) {
        return window.midgardCreate.localize(id, language);
      },
      language: null
    },

    _init: function () {
      this.vie = this.options.vie;
    },

    activate: function (data) {
      // An editable has been activated. Prepare the tag editor for the
      // entity
      var inputs = this._render(data.entity);
      this.loadTags(data.entity, data.predicate, inputs);
    },

    // Convert to reference URI as needed
    _normalizeSubject: function(subject) {
      if (this.vie.entities.isReference(subject)) {
        return subject;
      }
        
      if (subject.substr(0, 7) !== 'http://') {
        subject = 'urn:tag:' + subject;
      }

      subject = this.vie.entities.toReference(subject);
      return subject;
    },

    _tagLabel: function (subject) {
      subject = this.vie.entities.fromReference(subject);

      if (subject.substr(0, 8) === 'urn:tag:') {
        subject = subject.substr(8, subject.length - 1);
      }

      if (subject.substring(0, 7) == 'http://') {
        subject = subject.substr(subject.lastIndexOf('/') + 1, subject.length - 1);
        subject = subject.replace(/_/g, ' ');
      }
      return subject;
    },

    // Centralized method for adding new tags to an entity
    // regardless of whether they come from this widget
    // or Annotate.js
    addTag: function (entity, subject, label, type) {
      if (label === undefined) {
        label = this._tagLabel(subject);
      }

      subject = this._normalizeSubject(subject);
      var tags = entity.get(this.options.predicate);
      if (tags && tags.isCollection && tags.get(subject)) {
        return;
      }

      if (type && !entity.isReference(type)) {
        type = entity.toReference(type);
      }

      var tagEntity = this.vie.entities.addOrUpdate({
        '@subject': subject,
        'rdfs:label': label,
        '@type': type
      });

      if (!tags) {
        entity.set(this.options.predicate, tagEntity);
        return;
      }
      tags.addOrUpdate(tagEntity);
    },

    removeTag: function (entity, subject) {
      var tags = entity.get(this.options.predicate);
      if (!tags) {
        return;
      }

      subject = this._normalizeSubject(subject);
      var tag = tags.get(subject);
      if (!tag) {
        return;
      }

      tags.remove(subject);
    },

    // Listen for accepted annotations from Annotate.js if that 
    // is in use and register them as tags
    _listenAnnotate: function (entity, entityElement) {
      var widget = this;
      entityElement.on('annotateselect', function (event, data) {
        widget.addTag(entity, data.linkedEntity.uri, data.linkedEntity.label, data.linkedEntity.type[0]);
      });

      entityElement.on('annotateremove', function (event, data) {
        widget.removeTag(entity, data.linkedEntity.uri);
      });
    },

    _render: function (entity) {
      this.element.empty();
      var articleTags = jQuery(_.template(this.options.templates.tags, {
        type: 'article',
        label: this.options.localize('Item tags', this.options.language)
      }));
      var suggestedTags = jQuery(_.template(this.options.templates.tags, {
        type: 'suggested',
        label: this.options.localize('Suggested tags', this.options.language)
      }));

      // Tags plugin requires IDs to exist
      jQuery('input', articleTags).attr('id', 'articleTags-' + entity.cid);
      jQuery('input', suggestedTags).attr('id', 'suggestedTags-' + entity.cid);

      this.element.append(articleTags);
      this.element.append(suggestedTags);

      this._renderInputs(entity, articleTags, suggestedTags);
      return {
        tags: articleTags,
        suggested: suggestedTags
      };
    },

    _renderInputs: function (entity, articleTags, suggestedTags) {
      var widget = this;
      var subject = entity.getSubject();

      articleTags.tagsInput({
        width: 'auto',
        height: 'auto',
        onAddTag: function (tag) {
          widget.addTag(entity, tag);
        },
        onRemoveTag: function (tag) {
          widget.removeTag(entity, tag);
        },
        defaultText: this.options.localize('add a tag', this.options.language)
      });

      var selectSuggested = function () {
        var tag = jQuery.trim(jQuery(this).text());
        widget.addTag(entity, tag);
        suggestedTags.removeTag(tag);
      };

      suggestedTags.tagsInput({
        width: 'auto',
        height: 'auto',
        interactive: false,
        onAddTag: function (tag) {
          jQuery('.tag span', suggestedTags).off('click', selectSuggested);
          jQuery('.tag span', suggestedTags).on('click', selectSuggested);
        },
        onRemoveTag: function (tag) {
          jQuery('.tag span', suggestedTags).off('click', selectSuggested);
          jQuery('.tag span', suggestedTags).on('click', selectSuggested);
        },
        remove: false
      });
    },

    _getTagStrings: function (tags) {
      var tagArray = [];

      if (_.isString(tags)) {
        tagArray.push(tags);
        return tagArray;
      }

      if (tags.isCollection) {
        tags.each(function (tag) {
          tagArray.push(tag.get('rdfs:label'));
        });
        return tagArray;
      }

      _.each(tags, function (tag) {
        tagArray.push(this._tagLabel(tag));
      }, this);
      return tagArray;
    },

    loadTags: function (entity, predicate, inputs) {
      var widget = this;

      // Populate existing tags from entity
      var tags = entity.get(this.options.predicate);
      if (tags) {
        var tagArray = this._getTagStrings(tags);
        _.each(tagArray, inputs.tags.addTag, inputs.tags);
      }

      if (this.vie.services.stanbol) {
        //widget.enhance();
      } else {
        jQuery('.suggestedTags', widget.element).hide();
      }
    },

    _getLabelLang: function (labels) {
      if (!_.isArray(labels)) {
        return null;
      }

      var langLabel;

      _.each(labels, function (label) {
        if (label['@language'] === 'en') {
          langLabel = label['@value'];
        }
      });

      return langLabel;
    },

    _addEnhancement: function (entity, enhancement) {
      if (!enhancement.isEntity) {
        return;
      }

      var label = this._getLabelLang(enhancement.get('rdfs:label'));
      if (!label) {
        return;
      }

      var tags = entity.get(this.options.predicate);
      if (tags && tags.isCollection && tags.indexOf(enhancement) !== -1) {
        return;
      }

      this.suggestedTags.addTag(label);
    },

    enhance: function (entity, entityElement) {
      if (this.enhanced) {
        return;
      }
      this.enhanced = true;

      var widget = this;

      // load suggested tags
      this.vie.analyze({
        element: jQuery('[property]', entityElement)
      }).using(['stanbol']).execute().success(function (enhancements) {
        _.each(enhancements, function (enhancement) {
          widget._addEnhancement(entity, enhancement);
        });
      }).fail(function (xhr) {
        // console.log(xhr);
      });
    }
  });
})(jQuery);

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.bg = {
  // Session-state buttons for the main toolbar
  'Save': 'Запази',
  'Saving': 'Запазване',
  'Cancel': 'Откажи',
  'Edit': 'Редактирай',
  // Storage status messages
  'localModification': 'Елементът "<%= label %>" има локални модификации',
  'localModifications': '<%= number %> елемента на тази страница имат локални модификации',
  'Restore': 'Възстанови',
  'Ignore': 'Игнорирай',
  'saveSuccess': 'Елементът "<%= label %>" беше успешно запазен',
  'saveSuccessMultiple': '<%= number %> елемента бяха успешно запазени',
  'saveError': 'Възника грешка при запазване<br /><%= error %>',
  // Tagging
  'Item tags': 'Етикети на елемента',
  'Suggested tags': 'Препоръчани етикети',
  'Tags': 'Етикети',
  'add a tag': 'добави етикет',
  // Collection widgets
  'Add': 'Добави',
  'Choose type to add': 'Избери тип за добавяне'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.cs = {
  // Session-state buttons for the main toolbar
  'Save': 'Uložit',
  'Saving': 'Probíhá ukládání',
  'Cancel': 'Zrušit',
  'Edit': 'Upravit',
  // Storage status messages
  'localModification': 'Blok "<%= label %>" obsahuje lokální změny',
  'localModifications': '<%= number %> bloků na této stránce má lokální změny',
  'Restore': 'Aplikovat lokální změny',
  'Ignore': 'Zahodit lokální změny',
  'saveSuccess': 'Blok "<%= label %>" byl úspěšně uložen',
  'saveSuccessMultiple': '<%= number %> bloků bylo úspěšně uloženo',
  'saveError': 'Při ukládání došlo k chybě<br /><%= error %>',
  // Tagging
  'Item tags': 'Štítky bloku',
  'Suggested tags': 'Navrhované štítky',
  'Tags': 'Štítky',
  'add a tag': 'Přidat štítek',
  // Collection widgets
  'Add': 'Přidat',
  'Choose type to add': 'Vyberte typ k přidání'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.da = {
  // Session-state buttons for the main toolbar
  'Save': 'Gem',
  'Saving': 'Gemmer',
  'Cancel': 'Annullér',
  'Edit': 'Rediger',
  // Storage status messages
  'localModification': 'Element "<%= label %>" har lokale ændringer',
  'localModifications': '<%= number %> elementer på denne side har lokale ændringer',
  'Restore': 'Gendan',
  'Ignore': 'Ignorer',
  'saveSuccess': 'Element "<%= label %>" er gemt',
  'saveSuccessMultiple': '<%= number %> elementer er gemt',
  'saveError': 'Der opstod en fejl under lagring<br /><%= error %>',
  // Tagging
  'Item tags': 'Element tags',
  'Suggested tags': 'Foreslåede tags',
  'Tags': 'Tags',
  'add a tag': 'tilføj et tag',
  // Collection widgets
  'Add': 'Tilføj',
  'Choose type to add': 'Vælg type der skal tilføjes'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.de = {
  // Session-state buttons for the main toolbar
  'Save': 'Speichern',
  'Saving': 'Speichert',
  'Cancel': 'Abbrechen',
  'Edit': 'Bearbeiten',
  // Storage status messages
  'localModification': 'Das Dokument "<%= label %>" auf dieser Seite hat lokale Änderungen',
  'localModifications': '<%= number %> Dokumente auf dieser Seite haben lokale Änderungen',
  'Restore': 'Wiederherstellen',
  'Ignore': 'Ignorieren',
  'saveSuccess': 'Dokument "<%= label %>" erfolgreich gespeichert',
  'saveSuccessMultiple': '<%= number %> Dokumente erfolgreich gespeichert',
  'saveError': 'Fehler beim Speichern<br /><%= error %>',
  // Tagging
  'Item tags': 'Schlagwörter des Dokuments',
  'Suggested tags': 'Schlagwortvorschläge',
  'Tags': 'Schlagwörter',
  'add a tag': 'Neues Schlagwort',
  // Collection widgets
  'Add': 'Hinzufügen',
  'Choose type to add': 'Typ zum Hinzufügen wählen'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.en = {
  // Session-state buttons for the main toolbar
  'Save': 'Save',
  'Saving': 'Saving',
  'Cancel': 'Cancel',
  'Edit': 'Edit',
  // Storage status messages
  'localModification': 'Item "<%= label %>" has local modifications',
  'localModifications': '<%= number %> items on this page have local modifications',
  'Restore': 'Restore',
  'Ignore': 'Ignore',
  'saveSuccess': 'Item "<%= label %>" saved successfully',
  'saveSuccessMultiple': '<%= number %> items saved successfully',
  'saveError': 'Error occurred while saving<br /><%= error %>',
  // Tagging
  'Item tags': 'Item tags',
  'Suggested tags': 'Suggested tags',
  'Tags': 'Tags',
  'add a tag': 'add a tag',
  // Collection widgets
  'Add': 'Add',
  'Choose type to add': 'Choose type to add'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.es = {
  // Session-state buttons for the main toolbar
  'Save': 'Guardar',
  'Saving': 'Guardando',
  'Cancel': 'Cancelar',
  'Edit': 'Editar',
  // Storage status messages
  'localModification': 'El elemento "<%= label %>" tiene modificaciones locales',
  'localModifications': '<%= number %> elementos en la página tienen modificaciones locales',
  'Restore': 'Restaurar',
  'Ignore': 'Ignorar',
  'saveSuccess': 'El elemento "<%= label %>" se guardó exitosamente',
  'saveSuccessMultiple': '<%= number %> elementos se guardaron exitosamente',
  'saveError': 'Ha ocurrido un error cuando se guardaban los datos<br /><%= error %>',
  // Tagging
  'Item tags': 'Etiquetas de los elementos',
  'Suggested tags': 'Etiquetas sugeridas',
  'Tags': 'Etiquetas',
  'add a tag': 'añadir una etiqueta',
  // Collection widgets
  'Add': 'Añadir',
  'Choose type to add': 'Escoge el tipo a añadir'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.fi = {
  // Session-state buttons for the main toolbar
  'Save': 'Tallenna',
  'Saving': 'Tallennetaan',
  'Cancel': 'Peruuta',
  'Edit': 'Muokkaa',
  // Storage status messages
  'localModification': 'Dokumentilla "<%= label %>" on paikallisia muutoksia',
  'localModifications': '<%= number %> dokumenttia sivulla omaa paikallisia muutoksia',
  'Restore': 'Palauta',
  'Ignore': 'Poista',
  'saveSuccess': 'Dokumentti "<%= label %>" tallennettu',
  'saveSuccessMultiple': '<%= number %> dokumenttia tallennettu',
  'saveError': 'Virhe tallennettaessa<br /><%= error %>',
  // Tagging
  'Item tags': 'Avainsanat',
  'Suggested tags': 'Ehdotukset',
  'Tags': 'Avainsanat',
  'add a tag': 'lisää avainsana',
  // Collection widgets
  'Add': 'Lisää',
  'Choose type to add': 'Mitä haluat lisätä?'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.fr = {
  // Session-state buttons for the main toolbar
  'Save': 'Enregistrer',
  'Saving': 'Enregistrement en cours',
  'Cancel': 'Annuler',
  'Edit': 'Éditer',
  // Storage status messages
  'localModification': 'L\'élément "<%= label %>" comporte des modifications locales',
  'localModifications': '<%= number %> éléments sur cette page comportent des modifications locales',
  'Restore': 'Restaurer',
  'Ignore': 'Ignorer',
  'saveSuccess': 'L\'élément "<%= label %>" a été enregistré avec succès',
  'saveSuccessMultiple': '<%= number %> éléments ont été enregistrés avec succès',
  'saveError': 'Une erreur est survenue durant l\'enregistrement<br /><%= error %>',
  // Tagging
  'Item tags': 'Tags des éléments',
  'Suggested tags': 'Tags suggérés',
  'Tags': 'Tags',
  'add a tag': 'ajouter un tag',
  // Collection widgets
  'Add': 'Ajouter',
  'Choose type to add': 'Choisir le type à ajouter'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.he = {
  // Session-state buttons for the main toolbar
  'Save': 'שמור',
  'Saving': 'שומר',
  'Cancel': 'בטל',
  'Edit': 'ערוך',
  // Storage status messages
  'localModification': 'לפריט "<%= label %>" שינויים מקומיים',
  'localModifications': 'ל<%= number %> פריטים בדף זה שינויים מקומיים',
  'Restore': 'שחזר',
  'Ignore': 'התעלם',
  'saveSuccess': 'פריט "<%= label %>" נשמר בהצלחה',
  'saveSuccessMultiple': '<%= number %> פריטים נשמרו בהצלחה',
  'saveError': 'שגיאה בשמירה<br /><%= error %>',
  // Tagging
  'Item tags': 'סיווגי פריט',
  'Suggested tags': 'סיווגים מומלצים',
  'Tags': 'סיווגים',
  'add a tag': 'הוסף סיווג',
  // Collection widgets
  'Add': 'הוסף',
  'Choose type to add': 'בחר סוג להוספה'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.it = {
  // Session-state buttons for the main toolbar
  'Save': 'Salva',
  'Saving': 'Salvataggio',
  'Cancel': 'Esci',
  'Edit': 'Modifica',
  // Storage status messages
  'localModification': 'Articolo "<%= label %>" in questa pagina hanno modifiche locali',
  'localModifications': '<%= number %> articoli in questa pagina hanno modifiche locali',
  'Restore': 'Ripristina',
  'Ignore': 'Ignora',
  'saveSuccess': 'Articolo "<%= label %>" salvato con successo',
  'saveSuccessMultiple': '<%= number %> articoli salvati con successo',
  'saveError': 'Errore durante il salvataggio<br /><%= error %>',
  // Tagging
  'Item tags': 'Tags articolo',
  'Suggested tags': 'Tags suggerite',
  'Tags': 'Tags',
  'add a tag': 'Aggiungi una parola chiave',
  // Collection widgets
  'Add': 'Aggiungi',
  'Choose type to add': 'Scegli il tipo da aggiungere'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.nl = {
  // Session-state buttons for the main toolbar
  'Save': 'Opslaan',
  'Saving': 'Bezig met opslaan',
  'Cancel': 'Annuleren',
  'Edit': 'Bewerken',
  // Storage status messages
  'localModification': 'Items "<%= label %>" op de pagina heeft lokale wijzigingen',
  'localModifications': '<%= number %> items op de pagina hebben lokale wijzigingen',
  'Restore': 'Herstellen',
  'Ignore': 'Negeren',
  'saveSuccess': 'Item "<%= label %>" succesvol opgeslagen',
  'saveSuccessMultiple': '<%= number %> items succesvol opgeslagen',
  'saveError': 'Fout opgetreden bij het opslaan<br /><%= error %>',
  // Tagging
  'Item tags': 'Item tags',
  'Suggested tags': 'Tag suggesties',
  'Tags': 'Tags',
  'add a tag': 'tag toevoegen',
  // Collection widgets
  'Add': 'Toevoegen',
  'Choose type to add': 'Kies type om toe te voegen'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.no = {
  // Session-state buttons for the main toolbar
  'Save': 'Lagre',
  'Saving': 'Lagrer',
  'Cancel': 'Avbryt',
  'Edit': 'Rediger',
  // Storage status messages
  'localModification': 'Element "<%= label %>" på denne siden er modifisert lokalt',
  'localModifications': '<%= number %> elementer på denne siden er modifisert lokalt',
  'Restore': 'Gjenopprett',
  'Ignore': 'Ignorer',
  'saveSuccess': 'Element "<%= label %>" ble lagret',
  'saveSuccessMultiple': '<%= number %> elementer ble lagret',
  'saveError': 'En feil oppstod under lagring<br /><%= error %>',
  // Tagging
  'Item tags': 'Element-tagger',
  'Suggested tags': 'Anbefalte tagger',
  'Tags': 'Tagger',
  'add a tag': 'legg til tagg',
  // Collection widgets
  'Add': 'Legg til',
  'Choose type to add': 'Velg type å legge til'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.pl = {
  // Session-state buttons for the main toolbar
  'Save': 'Zapisz',
  'Saving': 'Zapisuję',
  'Cancel': 'Anuluj',
  'Edit': 'Edytuj',
  // Storage status messages
  'localModification': 'Artykuł "<%= label %>" posiada lokalne modyfikacje',
  'localModifications': '<%= number %> artykułów na tej stronie posiada lokalne modyfikacje',
  'Restore': 'Przywróć',
  'Ignore': 'Ignoruj',
  'saveSuccess': 'Artykuł "<%= label %>" został poprawnie zapisany',
  'saveSuccessMultiple': '<%= number %> artykułów zostało poprawnie zapisanych',
  'saveError': 'Wystąpił błąd podczas zapisywania<br /><%= error %>',
  // Tagging
  'Item tags': 'Tagi artykułów',
  'Suggested tags': 'Sugerowane tagi',
  'Tags': 'Tagi',
  'add a tag': 'dodaj tag',
  // Collection widgets
  'Add': 'Dodaj',
  'Choose type to add': 'Wybierz typ do dodania'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.pt_BR = {
  // Session-state buttons for the main toolbar
  'Save': 'Salvar',
  'Saving': 'Salvando',
  'Cancel': 'Cancelar',
  'Edit': 'Editar',
  // Storage status messages
  'localModification': 'Item "<%= label %>" nesta página possuem modificações locais',
  'localModifications': '<%= number %> itens nesta página possuem modificações locais',
  'Restore': 'Restaurar',
  'Ignore': 'Ignorar',
  'saveSuccess': 'Item "<%= label %>" salvo com sucesso',
  'saveSuccessMultiple': '<%= number %> itens salvos com sucesso',
  'saveError': 'Erro ocorrido ao salvar<br /><%= error %>',
  // Tagging
  'Item tags': 'Tags de item',
  'Suggested tags': 'Tags sugeridas',
  'Tags': 'Tags',
  'add a tag': 'adicionar uma tag',
  // Collection widgets
  'Add': 'Adicionar',
  'Choose type to add': 'Selecione o tipo para adicionar'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.ro = {
  // Session-state buttons for the main toolbar
  'Save': 'Salvează',
  'Saving': 'Se salvează',
  'Cancel': 'Anulează',
  'Edit': 'Editare',
  // Storage status messages
  'localModification': 'Zona "<%= label %>" a fost modificată',
  'localModifications': '<%= number %> zone din această pagină au fost modificate',
  'Restore': 'Revenire',
  'Ignore': 'Ignoră',
  'saveSuccess': 'Zona "<%= label %>" a fost salvată',
  'saveSuccessMultiple': '<%= number %> zone au fost salvate',
  'saveError': 'S-a produs o eroare în timpul salvării<br /><%= error %>',
  // Tagging
  'Item tags': 'Etichetele zonei',
  'Suggested tags': 'Etichete sugerate',
  'Tags': 'Etichete',
  'add a tag': 'adaugă o etichetă',
  // Collection widgets
  'Add': 'Adăugare',
  'Choose type to add': 'Alegeți un tip pentru adăugare'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.ru = {
  // Session-state buttons for the main toolbar
  'Save': 'Сохранить',
  'Saving': 'Сохраняю',
  'Cancel': 'Отмена',
  'Edit': 'Редактировать',
  // Storage status messages
  'localModification': 'В запись "<%= label %>" внесены несохранённые изменения',
  'localModifications': 'В записи на этой странице (<%= number %> шт.) внесены несохранённые изменения',
  'Restore': 'Восстановить',
  'Ignore': 'Игнорировать',
  'saveSuccess': 'Запись "<%= label %>" была успешно сохранена',
  'saveSuccessMultiple': ' Записи (<%= number %> шт.) были успешно сохранены',
  'saveError': 'Во время сохранения произошла ошибка<br /><%= error %>',
  // Tagging
  'Item tags': 'Теги записей',
  'Suggested tags': 'Предлагаемые теги',
  'Tags': 'Теги',
  'add a tag': 'добавить тег',
  // Collection widgets
  'Add': 'Добавить',
  'Choose type to add': 'Выбрать тип для добавления'
};

if (window.midgardCreate === undefined) {
  window.midgardCreate = {};
}
if (window.midgardCreate.locale === undefined) {
  window.midgardCreate.locale = {};
}

window.midgardCreate.locale.sv = {
  // Session-state buttons for the main toolbar
  'Save': 'Spara',
  'Saving': 'Sparar',
  'Cancel': 'Avbryt',
  'Edit': 'Redigera',
  // Storage status messages
  'localModification': 'Elementet "<%= label %>" har lokala förändringar',
  'localModifications': '<%= number %> element på den här sidan har lokala förändringar',
  'Restore': 'Återställ',
  'Ignore': 'Ignorera',
  'saveSuccess': 'Elementet "<%= label %>" sparades',
  'saveSuccessMultiple': '<%= number %> element sparades',
  'saveError': 'Ett fel uppstod under sparande<br /><%= error %>',
  // Tagging
  'Item tags': 'Element-taggar',
  'Suggested tags': 'Föreslagna taggar',
  'Tags': 'Taggar',
  'add a tag': 'lägg till en tagg',
  // Collection widgets
  'Add': 'Lägg till',
  'Choose type to add': 'Välj typ att lägga till'
};
