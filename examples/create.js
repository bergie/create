//     Create.js 1.0.0alpha2 - On-site web editing interface
//     (c) 2011-2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
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
        default: 'hallo' 
      },
      // Additional editor options.
      editorOptions: {
        hallo: {
          widget: 'halloWidget'
        }
      },
      collectionWidgets: {
        default: 'midgardCollectionAdd'
      },
      url: function () {},
      storagePrefix: 'node',
      workflows: {
        url: null
      },
      notifications: {},
      vie: null,
      stanbolUrl: null,
      dbPediaUrl: null,
      tags: false
    },

    _create: function () {
      if (this.options.vie) {
        this.vie = this.options.vie;
      } else {
        this.vie = new VIE();

        this.vie.use(new this.vie.RdfaService());

        if (this.options.stanbolUrl) {
          this.vie.use(new this.vie.StanbolService({
            proxyDisabled: true,
            url: this.options.stanbolUrl
          }));
        }

        if (this.options.dbPediaUrl) {
          this.vie.use(new this.vie.DBPediaService({
            proxyDisabled: true,
            url: this.options.dbPediaUrl
          }));
        }
      }

      var widget = this;
      window.setTimeout(function () {
        widget._checkSession();
      }, 10);

      this._enableToolbar();
      this._saveButton();
      this._editButton();
      this._prepareStorage();

      if (this.element.midgardWorkflows) {
        this.element.midgardWorkflows(this.options.workflows);
      }

      if (this.element.midgardNotifications) {
        this.element.midgardNotifications(this.options.notifications);
      }
    },

    _prepareStorage: function () {
      this.element.midgardStorage({
        vie: this.vie,
        url: this.options.url
      });

      this.element.bind('midgardstoragesave', function () {
        jQuery('#midgardcreate-save a').html('Saving <i class="icon-upload"></i>');
      });

      this.element.bind('midgardstoragesaved midgardstorageerror', function () {
        jQuery('#midgardcreate-save a').html('Save <i class="icon-ok"></i>');
      });
    },

    _init: function () {
      this.setState(this.options.state);

      // jQuery(this.element).data('midgardNotifications').showTutorial();
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

    showNotification: function (options) {
      if (this.element.midgardNotifications) {
        return jQuery(this.element).data('midgardNotifications').create(options);
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
      if (!Modernizr.sessionstorage) {
        return;
      }

      var toolbarID = this.options.storagePrefix + 'Midgard.create.toolbar';
      if (sessionStorage.getItem(toolbarID)) {
        this._setOption('toolbar', sessionStorage.getItem(toolbarID));
      }

      var stateID = this.options.storagePrefix + 'Midgard.create.state';
      if (sessionStorage.getItem(stateID)) {
        this.setState(sessionStorage.getItem(stateID));
      }

      this.element.bind('midgardcreatestatechange', function (event, options) {
        sessionStorage.setItem(stateID, options.state);
      });
    },

    _saveButton: function () {
      if (this.options.saveButton) {
        return this.options.saveButton;
      }

      jQuery('.create-ui-toolbar-statustoolarea .create-ui-statustools', this.element).append(jQuery('<li id="midgardcreate-save"><a class="create-ui-btn">Save <i class="icon-ok"></i></a></li>'));
      this.options.saveButton = jQuery('#midgardcreate-save', this.element);
      this.options.saveButton.hide();
      return this.options.saveButton;
    },

    _editButton: function () {
      var widget = this;
      jQuery('.create-ui-toolbar-statustoolarea .create-ui-statustools', this.element).append(jQuery('<li id="midgardcreate-edit"></li>'));
      jQuery('#midgardcreate-edit', this.element).bind('click', function () {
        if (widget.options.state === 'edit') {
          widget.setState('browse');
          return;
        }
        widget.setState('edit');
      });
    },

    _setEditButtonState: function (state) {
      var buttonContents = {
        edit: '<a class="create-ui-btn">Cancel <i class="icon-remove"></i></a>',
        browse: '<a class="create-ui-btn">Edit <i class="icon-edit"></i></a>'
      };
      var editButton = jQuery('#midgardcreate-edit', this.element);
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
      this.element.bind('midgardtoolbarstatechange', function (event, options) {
        if (Modernizr.sessionstorage) {
          sessionStorage.setItem(widget.options.storagePrefix + 'Midgard.create.toolbar', options.display);
        }
        widget._setOption('toolbar', options.display);
      });

      this.element.midgardToolbar({
        display: this.options.toolbar,
        vie: this.vie
      });
    },

    _enableEdit: function () {
      this._setOption('state', 'edit');
      var widget = this;
      var editableOptions = {
        toolbarState: widget.options.display,
        disabled: false,
        vie: widget.vie,
        widgets: widget.options.editorWidgets,
        editors: widget.options.editorOptions,
        collectionWidgets: widget.options.collectionWidgets
      };
      if (widget.options.enableEditor) {
        editableOptions[enableEditor] = widget.options.enableEditor;
      }
      if (widget.options.disableEditor) {
        editableOptions[disableEditor] = widget.options.disableEditor;
      }
      jQuery('[about]', this.element).each(function () {
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

              // Highlight the editable
              options.element.effect('highlight', {
                color: widget.options.highlightColor
              }, 3000);
            };

          jQuery(this).bind('midgardeditableenableproperty', highlightEditable);
        }
        jQuery(this).bind('midgardeditabledisable', function () {
          jQuery(this).unbind('midgardeditableenableproperty', highlightEditable);
        });

        if (widget.options.tags) {
          jQuery(this).bind('midgardeditableenable', function (event, options) {
            if (event.target !== element) {
              return;
            }
            jQuery(this).midgardTags({
              vie: widget.vie,
              entityElement: options.entityElement,
              entity: options.instance
            });
          });
        }

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
        editorOptions: widget.options.editorOptions
      };
      jQuery('[about]', this.element).each(function () {
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
//     Create.js - On-site web editing interface
//     (c) 2011-2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  // # Widget for adding items to a collection
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
      if (!widget.options.collection.localStorage) {
        widget.options.collection.url = widget.options.model.url();
      }

      widget.options.view.collection.bind('add', function (model) {
        model.primaryCollection = widget.options.collection;
        widget.options.vie.entities.add(model);
        model.collection = widget.options.collection;
      });

      widget._bindCollectionView(widget.options.view);
    },

    _bindCollectionView: function (view) {
      var widget = this;
      view.bind('add', function (itemView) {
        //itemView.el.effect('slide');
        widget._makeEditable(itemView);
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
      if (this.addButton) {
        this.addButton.remove();
        delete this.addButton;
      }
    }
  });
})(jQuery);
//     Create.js - On-site web editing interface
//     (c) 2011-2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  // # Widget for adding items anywhere inside a collection
  jQuery.widget('Midgard.midgardCollectionAddBetween', jQuery.Midgard.midgardCollectionAdd, {
    addButtons: [],

    _bindCollectionView: function (view) {
      var widget = this;
      view.bind('add', function (itemView) {
        //itemView.el.effect('slide');
        widget._makeEditable(itemView);
        widget._refreshButtons();
      });
      view.bind('remove', function () {
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
      var addButton = jQuery('<button class="btn"><i class="icon-plus"></i></button>').button();
      addButton.addClass('midgard-create-add');
      addButton.click(function () {
        widget.options.collection.add({}, {
          at: index
        });
      });
      return addButton;
    },

    enable: function () {
      var widget = this;

      var firstAddButton = widget.prepareButton(0);
      jQuery(widget.options.view.el).before(firstAddButton);
      widget.addButtons.push(firstAddButton);

      jQuery.each(widget.options.view.entityViews, function (cid, view) {
        var index = widget.options.collection.indexOf(view.model);
        var addButton = widget.prepareButton(index + 1);
        jQuery(view.el).after(addButton);
        widget.addButtons.push(addButton);
      });
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

    findEditableElements: function (callback) {
      this.vie.service('rdfa').findPredicateElements(this.options.model.id, jQuery('[property]', this.element), false).each(callback);
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

      if (!this.vie.services['rdfa']) {
        return;
      }

      _.forEach(this.vie.service('rdfa').views, function (view) {
        if (view instanceof widget.vie.view.Collection && widget.options.model === view.owner) {
          var collection = widget.enableCollection({
            model: widget.options.model,
            collection: view.collection,
            property: jQuery(view.el).attr('rel'),
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

    getElementPredicate: function (element) {
      return this.vie.service('rdfa').getElementPredicate(element);
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

      if (editable) {
        this._trigger('enableproperty', null, {
          editable: editable,
          property: propertyName,
          instance: this.options.model,
          element: element,
          entityElement: this.element
        });
      }

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
      }
    },

    collectionWidgetName: function (data) {
      if (this.options.collectionWidgets[data.property] !== undefined) {
        // Widget configuration set for specific RDF predicate
        return this.options.collectionWidgets[data.property];
      }

      var propertyType = 'default';
      var type = this.options.model.get('@type');
      if (type) {
        if (type.attributes && type.attributes.get(data.property)) {
          propertyType = type.attributes.get(data.property).range[0];
        }
      }
      if (this.options.collectionWidgets[propertyType] !== undefined) {
        return this.options.collectionWidgets[propertyType];
      }
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
//     Create.js - On-site web editing interface
//     (c) 2012 Tobias Herrmann, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  // # Base editing widget
  //
  // This editing widget provides a very simplistic `contentEditable` editor
  // that can be used as standalone, but should more usually be used as
  // the baseclass for other editing widgets.
  //
  // Basic editing widgets on this is easy:
  //
  //     jQuery.widget('Namespace.MyWidget', jQuery.Create.editWidget, {
  //       // override any properties
  //     });
  jQuery.widget('Create.editWidget', {
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
    // called by the jquery ui plugin factory when creating the widget
    // instance
    _create: function () {
      this._registerWidget();
      this._initialize();
    },
    // called every time the widget is called
    _init: function () {
      if (this.options.disabled) {
        this.disable();
        return;
      }
      this.enable();
    },
    // override this function to initialize the widget functions
    _initialize: function () {
      var self = this;
      var before = this.element.html();
      this.element.bind('blur keyup paste', function (event) {
        if (self.options.disabled) {
          return;
        }
        var current = jQuery(this).html();
        if (before !== current) {
          before = current;
          self.options.modified(current);
        }
      });
    },
    // used to register the widget name with the DOM element
    _registerWidget: function () {
      this.element.data("createWidgetName", this.widgetName);
    }
  });
})(jQuery);
//     Create.js - On-site web editing interface
//     (c) 2012 Tobias Herrmann, IKS Consortium
//     (c) 2011 Rene Kapusta, Evo42
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  // # Aloha editing widget
  //
  // This widget allows editing textual contents using the
  // [Aloha](http://aloha-editor.org) rich text editor.
  //
  // Due to licensing incompatibilities, Aloha Editor needs to be installed
  // and configured separately.
  jQuery.widget('Create.alohaWidget', jQuery.Create.editWidget, {
    enable: function () {
      this._initialize();
      this.options.disabled = false;
    },
    disable: function () {
      Aloha.jQuery(this.options.element.get(0)).mahalo();
      this.options.disabled = true;
    },
    _initialize: function () {
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

      // Subscribe to activation and deactivation events
      Aloha.bind('aloha-editable-activated', function (event, data) {
        if (data.editable !== editable) {
          return;
        }
        options.activated();
      });
      Aloha.bind('aloha-editable-deactivated', function (event, data) {
        if (data.editable !== editable) {
          return;
        }
        options.deactivated();
      });

      Aloha.bind('aloha-smart-content-changed', function (event, data) {
        if (data.editable !== editable) {
          return;
        }
        if (!data.editable.isModified()) {
          return true;
        }
        options.modified(data.editable.getContents());
        data.editable.setUnmodified();
      });
    }
  });
})(jQuery);
//     Create.js - On-site web editing interface
//     (c) 2012 Tobias Herrmann, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  // # Hallo editing widget
  //
  // This widget allows editing textual content areas with the
  // [Hallo](http://hallojs.org) rich text editor.
  jQuery.widget('Create.halloWidget', jQuery.Create.editWidget, {
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
      jQuery(this.element).bind('halloactivated', function (event, data) {
        self.options.activated();
      });
      jQuery(this.element).bind('hallodeactivated', function (event, data) {
        self.options.deactivated();
      });
      jQuery(this.element).bind('hallomodified', function (event, data) {
        self.options.modified(data.content);
        data.editable.setUnmodified();
      });

      jQuery(document).bind('midgardtoolbarstatechange', function(event, data) {
        // Switch between Hallo configurations when toolbar state changes
        if (data.display === self.options.toolbarState) {
          return;
        }
        self.options.toolbarState = data.display;
        jQuery(self.element).hallo(self.getHalloOptions());
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
          },
          halloindicator: {}
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
        defaults.showAlways = false;
        defaults.toolbar = 'halloToolbarContextual';
      }
      return _.extend(defaults, this.options.editorOptions);
    }
  });
})(jQuery);
//     Create.js - On-site web editing interface
//     (c) 2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  // # Redactor editing widget
  //
  // This widget allows editing textual content areas with the
  // [Redactor](http://redactorjs.com/) rich text editor.
  jQuery.widget('Create.redactorWidget', jQuery.Create.editWidget, {
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
      jQuery(this.element).bind('focus', function (event) {
        self.options.activated(); 
      });
      /*
      jQuery(this.element).bind('blur', function (event) {
        self.options.deactivated(); 
      });
      */
    },

    getRedactorOptions: function () {
      var self = this;
      var overrides = {
        keyupCallback: function (obj, event) {
          self.options.modified(jQuery(self.element).getCode());
        },
        execCommandCallback: function (obj, command) {
          self.options.modified(jQuery(self.element).getCode());
        }
      };

      return _.extend(self.options.editorOptions, overrides);
    }
  });
})(jQuery);
//     Create.js - On-site web editing interface
//     (c) 2012 Jerry Jalava, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
/*
 jQuery(this.element).data('midgardNotifications').create({body: 'Content here!'});
 jQuery(this.element).data('midgardNotifications').create({
 body: "Do you wan't to run tests now?",
     actions: [
         {
             name: 'runtests', label: 'Run tests',
             cb: function(e, notification) {
                 alert('Running tests');
                 notification.close();
             }
         },
         {
             name: 'cancel', label: 'Cancel',
             cb: function(e, notification) {
                 notification.close();
             }
         }
     ]
 });
 */
(function (jQuery, undefined) {
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
              action.bind('click', function (e) {
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

          _item.bind('click', function (e) {
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
          return this._isFixed(element.offsetParent());
        },

        _setPosition: function () {
          if (_config.bindTo) {
            itemDimensions = {
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
            
            var pos = this._calculatePositionForGravity(_item, _config.gravity, targetDimensions, itemDimensions);
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
            setTimeout(function () {
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
                back_label = item.back_label;
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
                forward_label = item.forward_label;
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
            next_item = _storyline[_current_item.name].forward;
            this._showNotification(_storyline[next_item]);
          } else {
            this._showNotification(_storyline[_last_item_name]);
          }
        },
        previous: function () {
          if (_previous_item_name) {
            _current_item.close();
            if (_storyline[_current_item.name].back) {
              prev_item = _storyline[_current_item.name].back;
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
        jQuery('body').bind('midgardtoolbarstatechange', function (event, options) {
          if (options.display == 'full') {
            story.next();
            jQuery('body').unbind('midgardtoolbarstatechange');
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
        jQuery('body').bind('midgardcreatestatechange', function (event, options) {
          if (options.state == 'edit') {
            story.next();
            jQuery('body').unbind('midgardcreatestatechange');
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

      item = new MidgardNotification(this.container, options);
      item.show();

      return item;
    },

    showTutorial: function () {
      this.showStory({}, _createTutorialStoryline);
    }
  });

})(jQuery);
//     Create.js - On-site web editing interface
//     (c) 2011-2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  jQuery.widget('Midgard.midgardStorage', {
    changedModels: [],
    saveEnabled: true,
    options: {
      // Whether to use localstorage
      localStorage: false,
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
      editableNs: 'midgardeditable'
    },

    _create: function () {
      var widget = this;

      if (window.localStorage) {
        this.options.localStorage = true;
      }

      this.vie = this.options.vie;

      this.vie.entities.bind('add', function (model) {
        // Add the back-end URL used by Backbone.sync
        model.url = widget.options.url;
        model.toJSON = model.toJSONLD;
      });

      jQuery('#midgardcreate-save').click(function () {
        widget._saveRemote({
          success: function () {
            jQuery('#midgardcreate-save').button({
              disabled: true
            });
          },
          error: function () {}
        });
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

        widget._saveRemote({
          success: function () {
            jQuery('#midgardcreate-save').button({
              disabled: true
            });
          },
          error: function () {}
        });
      };

      var timeout = window.setInterval(doAutoSave, widget.options.autoSaveInterval);

      this.element.bind('startPreventSave', function () {
        if (timeout) {
          window.clearInterval(timeout);
          timeout = null;
        }
        widget.disableSave();
      });
      this.element.bind('stopPreventSave', function () {
        if (!timeout) {
          timeout = window.setInterval(doAutoSave, widget.options.autoSaveInterval);
        }
        widget.enableSave();
      });

    },

    enableSave: function () {
      this.saveEnabled = true;
    },

    disableSave: function () {
      this.saveEnabled = false;
    },

    _bindEditables: function () {
      var widget = this;
      var restorables = [];
      var restorer;

      widget.element.bind(widget.options.editableNs + 'changed', function (event, options) {
        if (_.indexOf(widget.changedModels, options.instance) === -1) {
          widget.changedModels.push(options.instance);
        }
        widget._saveLocal(options.instance);
        jQuery('#midgardcreate-save').button({disabled: false});
      });

      widget.element.bind(widget.options.editableNs + 'disable', function (event, options) {
        widget._restoreLocal(options.instance);
        jQuery('#midgardcreate-save').hide();
      });

      widget.element.bind(widget.options.editableNs + 'enable', function (event, options) {
        jQuery('#midgardcreate-save').button({disabled: true});
        jQuery('#midgardcreate-save').show();

        if (!options.instance._originalAttributes) {
          options.instance._originalAttributes = _.clone(options.instance.attributes);
        }

        if (!options.instance.isNew() && widget._checkLocal(options.instance)) {
          // We have locally-stored modifications, user needs to be asked
          restorables.push(options.instance);
        }

        /*_.each(options.instance.attributes, function (attributeValue, property) {
          if (attributeValue instanceof widget.vie.Collection) {
            widget._readLocalReferences(options.instance, property, attributeValue);
          }
        });*/
      });

      widget.element.bind('midgardcreatestatechange', function (event, options) {
        if (options.state === 'browse' || restorables.length === 0) {
          restorables = [];
          if (restorer) {
            restorer.close();
          }
          return;
        }
        
        restorer = jQuery('body').data('midgardCreate').showNotification({
          bindTo: '#midgardcreate-edit a',
          gravity: 'TR',
          body: restorables.length + " items on this page have local modifications",
          timeout: 0,
          actions: [
            {
              name: 'restore',
              label: 'Restore',
              cb: function() {
                _.each(restorables, function (instance) {
                  widget._readLocal(instance);
                });
                restorables = [];
                restorer = null;
              },
              className: 'create-ui-btn'
            },
            {
              name: 'ignore',
              label: 'Ignore',
              cb: function(event, notification) {
                if (widget.options.removeLocalstorageOnIgnore) {
                  _.each(restorables, function (instance) {
                    widget._removeLocal(instance);
                  });
                }
                notification.close();
                restorables = [];
                restorer = null;
              },
              className: 'create-ui-btn'
            }
          ]
        });
      });

      widget.element.bind('midgardstorageloaded', function (event, options) {
        if (_.indexOf(widget.changedModels, options.instance) === -1) {
          widget.changedModels.push(options.instance);
        }
        jQuery('#midgardcreate-save').button({
          disabled: false
        });
      });
    },

    _saveRemote: function (options) {
      var widget = this;
      if (widget.changedModels.length === 0) {
        return;
      }

      widget._trigger('save', null, {
        models: widget.changedModels
      });

      var needed = widget.changedModels.length;
      if (needed > 1) {
        notification_msg = needed + ' objects saved successfully';
      } else {
        subject = widget.changedModels[0].getSubjectUri();
        notification_msg = 'Object with subject ' + subject + ' saved successfully';
      }

      widget.disableSave();
      _.forEach(widget.changedModels, function (model, index) {

        // Optionally handle entities referenced in this model first
        _.each(model.attributes, function (value, property) {
          if (!value || !value.isCollection) {
            return;
          }

          value.each(function (referencedModel) {
            if (widget.changedModels.indexOf(referencedModel) !== -1) {
              // The referenced model is already in the save queue
              return;
            }

            if (referencedModel.isNew() && widget.options.saveReferencedNew) {
              return referencedModel.save();
            }

            if (referencedModel.hasChanged() && widget.options.saveReferencedChanged) {
              return referencedModel.save();
            }
          });
        });

        model.save(null, {
          success: function () {
            // From now on we're going with the values we have on server
            model._originalAttributes = _.clone(model.attributes);

            widget._removeLocal(model);
            widget.changedModels.splice(index, 1);
            needed--;
            if (needed <= 0) {
              // All models were happily saved
              widget._trigger('saved', null, {});
              options.success();
              jQuery('body').data('midgardCreate').showNotification({
                body: notification_msg
              });
              widget.enableSave();
            }
          },
          error: function (m, err) {
            notification_msg = 'Error occurred while saving';
            if (err.responseText) {
              notification_msg = notification_msg + ':<br />' + err.responseText;
            }

            options.error();
            jQuery('body').data('midgardCreate').showNotification({
              body: notification_msg,
              timeout: 0
            });

            widget._trigger('error', null, {
              instance: model
            });
          }
        });
      });
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
      localStorage.setItem(model.getSubjectUri(), JSON.stringify(model.toJSONLD()));
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
      var identifier = subject + ':' + predicate;
      var json = model.toJSONLD();
      if (localStorage.getItem(identifier)) {
        var referenceList = JSON.parse(localStorage.getItem(identifier));
        var index = _.pluck(referenceList, '@').indexOf(json['@']);
        if (index !== -1) {
          referenceList[index] = json;
        } else {
          referenceList.push(json);
        }
        localStorage.setItem(identifier, JSON.stringify(referenceList));
        return;
      }
      localStorage.setItem(identifier, JSON.stringify([json]));
    },

    _checkLocal: function (model) {
      if (!this.options.localStorage) {
        return false;
      }

      var local = localStorage.getItem(model.getSubjectUri());
      if (!local) {
        return false;
      }

      return true;
    },

    _readLocal: function (model) {
      if (!this.options.localStorage) {
        return;
      }

      var local = localStorage.getItem(model.getSubjectUri());
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

      var identifier = this._getReferenceId(model, property);
      var local = localStorage.getItem(identifier);
      if (!local) {
        return;
      }
      collection.add(JSON.parse(local));
    },

    _restoreLocal: function (model) {
      var widget = this;

      // Remove unsaved collection members
      if (!model) { return; }
      _.each(model.attributes, function (attributeValue, property) {
        if (attributeValue instanceof widget.vie.Collection) {
          attributeValue.forEach(function (model) {
            if (model.isNew()) {
              attributeValue.remove(model);
            }
          });
        }
      });

      // Restore original object properties
      if (jQuery.isEmptyObject(model.changedAttributes())) {
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

      localStorage.removeItem(model.getSubjectUri());
    }
  });
})(jQuery);
//     Create.js - On-site web editing interface
//     (c) 2012 IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  jQuery.widget('Midgard.midgardTags', {
    enhanced: false,

    options: {
      vie: null,
      entity: null,
      element: null,
      entityElement: null,
      parentElement: '.create-ui-tool-metadataarea',
      predicate: 'skos:related'
    },

    _init: function () {
      var widget = this;

      this.vie = this.options.vie;
      this.entity = this.options.entity;
      this.element = this.options.element;
      jQuery(this.options.entityElement).bind('midgardeditableactivated', function (event, data) {
        if (data.instance !== widget.options.entity) {
          return;
        }
        widget._renderWidget();
        widget.loadTags();
      });

      jQuery(this.options.entityElement).bind('midgardeditablechanged', function (event, data) {
        if (data.instance !== widget.options.entity) {
          return;
        }
        widget.enhanced = false;
      });

      this._listenAnnotate(this.options.entityElement);
    },

    // Convert to reference URI as needed
    _normalizeSubject: function(subject) {
      if (this.entity.isReference(subject)) {
        return subject;
      }
        
      if (subject.substr(0, 7) !== 'http://') {
        subject = 'urn:tag:' + subject;
      }

      subject = this.entity.toReference(subject);
      return subject;
    },

    _tagLabel: function (subject) {
      subject = this.entity.fromReference(subject);

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
    addTag: function (subject, label, type) {
      if (label === undefined) {
        label = this._tagLabel(subject);
      }

      subject = this._normalizeSubject(subject);

      if (type && !this.entity.isReference(type)) {
        type = this.entity.toReference(type);
      }

      var tagEntity = this.vie.entities.addOrUpdate({
        '@subject': subject,
        'rdfs:label': label,
        '@type': type
      });

      var tags = this.options.entity.get(this.options.predicate);
      if (!tags) {
        tags = new this.vie.Collection();
        tags.vie = this.options.vie;
        this.options.entity.set(this.options.predicate, tags);
      } else if (!tags.isCollection) {
        tags = new this.vie.Collection(_.map(tags, function(tag) {
          if (tag.isEntity) {
            return tag;
          }
          return {
            '@subject': tag
          };
        }));
        tags.vie = this.options.vie;
        this.options.entity.set(this.options.predicate, tags);
      }

      tags.addOrUpdate(tagEntity);

      this.options.entityElement.trigger('midgardeditablechanged', {
        instance: this.options.entity
      });
    },

    removeTag: function (subject) {
      var tags = this.options.entity.get(this.options.predicate);
      if (!tags) {
        return;
      }

      subject = this._normalizeSubject(subject);
      var tag = tags.get(subject);
      if (!tag) {
        return;
      }

      tags.remove(subject);
      this.options.entityElement.trigger('midgardeditablechanged', {
        instance: this.options.entity
      });
    },

    // Listen for accepted annotations from Annotate.js if that 
    // is in use
    // and register them as tags
    _listenAnnotate: function (entityElement) {
      var widget = this;
      entityElement.bind('annotateselect', function (event, data) {
        widget.addTag(data.linkedEntity.uri, data.linkedEntity.label, data.linkedEntity.type[0]);
      });

      entityElement.bind('annotateremove', function (event, data) {
        widget.removeTag(data.linkedEntity.uri);
      });
    },

    _prepareEditor: function (button) {
      var contentArea = jQuery('<div class="dropdown-menu"></div>');
      var articleTags = jQuery('<div class="create-ui-tags articleTags"><h3>Article tags</h3><input type="text" class="tags" value="" /></div>');
      var suggestedTags = jQuery('<div class="create-ui-tags suggestedTags"><h3>Suggested tags</h3><input type="text" class="tags" value="" /></div>');

      // Tags plugin requires IDs to exist
      jQuery('input', articleTags).attr('id', 'articleTags-' + this.entity.cid);
      jQuery('input', suggestedTags).attr('id', 'suggestedTags-' + this.entity.cid);

      contentArea.append(articleTags);
      contentArea.append(suggestedTags);
      contentArea.hide();

      var offset = button.position();
      contentArea.css('position', 'absolute');
      contentArea.css('left', offset.left);

      return contentArea;
    },

    _renderWidget: function () {
      var widget = this;
      var subject = this.entity.getSubject();

      var button = jQuery('<button class="create-ui-btn"><i class="icon-tags"></i> Tags</a>').button();

      var parentElement = jQuery(this.options.parentElement);
      parentElement.empty();
      parentElement.append(button);
      parentElement.show();

      var contentArea = this._prepareEditor(button);
      button.after(contentArea);

      this.articleTags = jQuery('.articleTags input', contentArea).tagsInput({
        width: 'auto',
        height: 'auto',
        onAddTag: function (tag) {
          widget.addTag(tag);
        },
        onRemoveTag: function (tag) {
          widget.removeTag(tag);
        }
      });

      var selectSuggested = function () {
        var tag = jQuery.trim(jQuery(this).text());
        widget.articleTags.addTag(tag);
        widget.suggestedTags.removeTag(tag);
      };

      this.suggestedTags = jQuery('.suggestedTags input', contentArea).tagsInput({
        width: 'auto',
        height: 'auto',
        interactive: false,
        onAddTag: function (tag) {
          jQuery('.suggestedTags .tag span', contentArea).unbind('click', selectSuggested);
          jQuery('.suggestedTags .tag span', contentArea).bind('click', selectSuggested);
        },
        onRemoveTag: function (tag) {
          jQuery('.suggestedTags .tag span', contentArea).unbind('click', selectSuggested);
          jQuery('.suggestedTags .tag span', contentArea).bind('click', selectSuggested);
        },
        remove: false
      });

      button.bind('click', function() {
        contentArea.toggle();
      });
    },

    loadTags: function () {
      var widget = this;

      // Populate existing tags from entity
      var tags = this.entity.get(this.options.predicate);
      if (tags) {
        if (_.isString(tags)) {
          widget.articleTags.addTag(widget._tagLabel(tags));
        } else if (tags.isCollection) {
          tags.each(function (tag) {
            widget.articleTags.addTag(tag.get('rdfs:label'));
          });
        } else {
          _.each(tags, function (tag) {
            widget.articleTags.addTag(widget._tagLabel(tag));
          });
        }
      }

      if (this.vie.services.stanbol) {
        widget.enhance();
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

    _addEnhancement: function (enhancement) {
      if (!enhancement.isEntity) {
        return;
      }

      var label = this._getLabelLang(enhancement.get('rdfs:label'));
      if (!label) {
        return;
      }

      var tags = this.options.entity.get(this.options.predicate);
      if (tags && tags.isCollection && tags.indexOf(enhancement) !== -1) {
        return;
      }

      this.suggestedTags.addTag(label);
    },

    enhance: function () {
      if (this.enhanced) {
        return;
      }
      this.enhanced = true;

      var widget = this;

      // load suggested tags
      this.vie.analyze({
        element: jQuery('[property]', this.options.entityElement)
      }).using(['stanbol']).execute().success(function (enhancements) {
        _.each(enhancements, function (enhancement) {
          widget._addEnhancement(enhancement);
        });
      }).fail(function (xhr) {
        // console.log(xhr);
      });
    }
  });
})(jQuery);
//     Create.js - On-site web editing interface
//     (c) 2011-2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  jQuery.widget('Midgard.midgardToolbar', {
    options: {
      display: 'full',
    },

    _create: function () {
      this.element.append(this._getMinimized());
      this.element.append(this._getFull());

      var widget = this;
      jQuery('.create-ui-toggle').click(function () {
        if (widget.options.display === 'full') {
          widget.hide();
          widget.options.display = 'minimized';
        } else {
          widget.show();
          widget.options.display = 'full';
        }
        widget._trigger('statechange', null, widget.options);
      });

      this._setDisplay(this.options.display);

      widget = this;

      jQuery(this.element).bind('midgardcreatestatechange', function (event, options) {
        if (options.state == 'browse') {
          widget._clearWorkflows();
          widget._clearMetadata();
        }
      });

      jQuery(this.element).bind('midgardworkflowschanged', function (event, options) {
        widget._clearWorkflows();
        if (options.workflows.length) {
          options.workflows.each(function (workflow) {
            html = jQuery('body').data().midgardWorkflows.prepareItem(options.instance, workflow, function (err, model) {
              widget._clearWorkflows();
              if (err) {
                return;
              }
            });
            jQuery('.create-ui-tool-workflowarea', this.element).append(html);
          });
        }
      });
    },

    _setOption: function (key, value) {
      if (key === 'display') {
        this._setDisplay(value);
      }
      this.options[key] = value;
    },

    _setDisplay: function (value) {
      if (value === 'minimized') {
        jQuery('div.create-ui-toolbar-wrapper').hide();
      } 
    },

    hide: function () {
      jQuery('div.create-ui-toolbar-wrapper').fadeToggle('fast', 'linear');
    },

    show: function () {
      jQuery('div.create-ui-toolbar-wrapper').fadeToggle('fast', 'linear');
    },

    _getMinimized: function () {
      return jQuery('<div class="create-ui-logo"><a class="create-ui-toggle" id="create-ui-toggle-toolbar"></a></div>');
    },

    _getFull: function () {
      return jQuery('<div class="create-ui-toolbar-wrapper"><div class="create-ui-toolbar-toolarea"><div class="create-ui-toolbar-dynamictoolarea"><ul class="create-ui-dynamictools create-ui-toolset-1"><li class="create-ui-tool-metadataarea"></li><li class="create-ui-tool-workflowarea"></li><li class="create-ui-tool-freearea"></li></ul></div><div class="create-ui-toolbar-statustoolarea"><ul class="create-ui-statustools"></ul></div></div></div>');
    },

    _clearWorkflows: function () {
      jQuery('.create-ui-tool-workflowarea', this.element).empty();
    },

    _clearMetadata: function () {
      jQuery('.create-ui-tool-metadataarea', this.element).empty();
    }
  });
})(jQuery);
//     Create.js - On-site web editing interface
//     (c) 2012 Jerry Jalava, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  jQuery.widget('Midgard.midgardWorkflows', {
    options: {
      url: function (model) {},
      renderers: {
        button: function (model, workflow, action_cb, final_cb) {
          button_id = 'midgardcreate-workflow_' + workflow.get('name');
          html = jQuery('<button class="create-ui-btn" id="' + button_id + '">' + workflow.get('label') + '</button>').button();

          html.bind('click', function (evt) {
            action_cb(model, workflow, final_cb);
          });
          return html;
        }
      },
      action_types: {
        backbone_save: function (model, workflow, callback) {
          copy_of_url = model.url;
          original_model = model.clone();
          original_model.url = copy_of_url;

          action = workflow.get('action');
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
          copy_of_url = model.url;
          original_model = model.clone();
          original_model.url = copy_of_url;

          action = workflow.get('action');
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
          action = workflow.get('action');
          if (!action.url) {
            return callback('No action url defined!');
          }

          wf_opts = {};
          if (action.http) {
            wf_opts = action.http;
          }

          ajax_options = jQuery.extend({
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
      jQuery(this.element).bind('midgardeditableactivated', function (event, options) {
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
        flows = new(widget._generateCollectionFor(model))([], {});
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

      renderer = this.getRenderer(workflow.get("type"));
      action_type_cb = this.getActionType(workflow.get("action").type);

      return renderer(model, workflow, action_type_cb, function (err, m) {
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
