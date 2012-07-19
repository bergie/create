//     Create.js {{ VERSION }} - On-site web editing interface
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
      if (this.options.state === 'edit') {
        this._enableEdit();
      } else {
        this._disableEdit();
      }

      // jQuery(this.element).data('midgardNotifications').showTutorial();            
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
        this._setOption('state', sessionStorage.getItem(stateID));
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
      var buttonContents = {
        edit: '<a class="create-ui-btn">Cancel <i class="icon-remove"></i></a>',
        browse: '<a class="create-ui-btn">Edit <i class="icon-edit"></i></a>'
      };

      jQuery('.create-ui-toolbar-statustoolarea .create-ui-statustools', this.element).append(jQuery('<li id="midgardcreate-edit">' + buttonContents[widget.options.state] + '</li>'));
      var editButton = jQuery('#midgardcreate-edit', this.element);
      if (this.options.state === 'edit') {
        editButton.addClass('selected');
      }
      editButton.bind('click', function () {
        if (widget.options.state === 'edit') {
          widget._disableEdit();
          editButton.html(buttonContents[widget.options.state]);
          return;
        }
        widget._enableEdit();
        editButton.html(buttonContents[widget.options.state]);
      });
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
        editors: widget.options.editorOptions
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
