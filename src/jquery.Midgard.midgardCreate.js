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
        buttonContent: '<%= label %> <i class="icon-<%= icon %>"></i>',
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

      jQuery('.create-ui-tool-metadataarea', this.element).midgardMetadata({
        vie: this.vie,
        localize: this.options.localize,
        language: this.options.language,
        editors: this.options.metadata,
        createElement: this.element,
        editableNs: 'midgardeditable'
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
