(function(jQuery, undefined) {
    
    jQuery.widget('Midgard.midgardCreate', {
        options: {
            statechange: function() {},
            toolbar: 'full',
            saveButton: null,
            state: 'browse',
            highlight: true,
            highlightColor: '#67cc08',
            editor: 'hallo',
            editorOptions: {},
            enableEditor: null,
            disableEditor: null,
            url: function() {},
            storagePrefix: 'node',            
            workflows: {
                url: null
            },
            notifications: {},
            vie: null
        },
    
        _create: function() {
            if (this.options.vie) {
              this.vie = this.options.vie;
            } else {
              this.vie = new VIE({classic: true});
            }
            this._checkSession();
            this._enableToolbar();
            this._saveButton();
            this._editButton();
            this.element.midgardStorage({vie: this.vie, url: this.options.url});          
            
            if (this.element.midgardWorkflows) {
                this.element.midgardWorkflows(this.options.workflows);
            }
            
            if (this.element.midgardNotifications) {
                this.element.midgardNotifications(this.options.notifications);
            }
        },
        
        _init: function() {
            if (this.options.state === 'edit') {
                this._enableEdit();
            } else {
                this._disableEdit();
            }
            
            // jQuery(this.element).data('midgardNotifications').showTutorial();            
        },
        
        showNotification: function(options) {
            if (this.element.midgardNotifications) {
                jQuery(this.element).data('midgardNotifications').create(options);
            }
        },
        
        _checkSession: function() {
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
           
            this.element.bind('midgardcreatestatechange', function(event, options) {
                sessionStorage.setItem(stateID, options.state);
            });
        },
        
        _saveButton: function() {
            if (this.options.saveButton) {
                return this.options.saveButton;
            }
            
            jQuery('#midgard-bar .toolbarcontent-right', this.element).append(jQuery('<button id="midgardcreate-save">Save</button>'));
            this.options.saveButton = jQuery('#midgardcreate-save', this.element);
            this.options.saveButton.button({disabled: true});
            return this.options.saveButton;
        },
        
        _editButton: function() {
            var widget = this;
            jQuery('#midgard-bar .toolbarcontent-right', this.element).append(jQuery('<input type="checkbox" id="midgardcreate-edit" /><label for="midgardcreate-edit">Edit</label>'));
            var editButton = jQuery('#midgardcreate-edit', this.element).button();
            if (this.options.state === 'edit') {
                editButton.attr('checked', true);
                editButton.button('refresh');
            }
            editButton.bind('change', function() {
                if (widget.options.state === 'edit') {
                  //editButton.attr('checked', false);
                  widget._disableEdit();
                  return;
                }
                widget._enableEdit();
            });
        },
        
        _enableToolbar: function() {
            var widget = this;
            this.element.bind('midgardtoolbarstatechange', function(event, options) {
                if (Modernizr.sessionstorage) {
                    sessionStorage.setItem(widget.options.storagePrefix + 'Midgard.create.toolbar', options.display);
                }
                widget._setOption('toolbar', options.display);
            });

            this.element.midgardToolbar({display: this.options.toolbar, vie: this.vie});
        },
        
        _enableEdit: function() {
            this._setOption('state', 'edit');
            var widget = this;
            var editableOptions = {
                disabled: false,
                vie: widget.vie,
                editor: widget.options.editor,
                editorOptions: widget.options.editorOptions,
            };
            if (widget.options.enableEditor) {
                editableOptions[enableEditor] = widget.options.enableEditor;
            }
            if (widget.options.disableEditor) {
                editableOptions[disableEditor] = widget.options.disableEditor;
            }

            jQuery('[about]', this.element).each(function() {
                var element = this;
                if (widget.options.highlight) {
                    var highlightEditable = function(event, options) {
                        if (options.entityElement.get(0) !== element) {
                            // Propagated event from another entity, ignore
                            return;
                        }

                        // Highlight the editable
                        options.element.effect('highlight', {color: widget.options.highlightColor}, 3000);
                    };
                
                    jQuery(this).bind('midgardeditableenableproperty', highlightEditable);
                }
                jQuery(this).bind('midgardeditabledisable', function() {
                    jQuery(this).unbind('midgardeditableenableproperty', highlightEditable);
                });

                jQuery(this).midgardEditable(editableOptions);
            });
            this._trigger('statechange', null, {state: 'edit'});
        },
        
        _disableEdit: function() {
            var widget = this;
            var editableOptions = {
                disabled: true,
                vie: widget.vie,
                editor: widget.options.editor,
                editorOptions: widget.options.editorOptions,
            };
            if (widget.options.enableEditor) {
                editableOptions[enableEditor] = widget.options.enableEditor;
            }
            if (widget.options.disableEditor) {
                editableOptions[disableEditor] = widget.options.disableEditor;
            }
            jQuery('[about]', this.element).each(function() {
                jQuery(this).midgardEditable(editableOptions).removeClass('ui-state-disabled');
            });
            this._setOption('state', 'browse');
            this._trigger('statechange', null, {state: 'browse'});
        }
    });
})(jQuery);
