(function(jQuery, undefined) {
    jQuery.widget('Midgard.midgardCreate', {
        options: {
            statechange: function() {},
            toolbar: 'full',
            saveButton: null,
            state: 'browse',
            highlightColor: '#67cc08'
        },
    
        _create: function() {
            this.vie = new VIE({classic: true});
            this._checkSession();
            this._enableToolbar();
            this._saveButton();
            this._editButton();
            this.element.midgardStorage({vie: this.vie});
        },
        
        _init: function() {
            if (this.options.state === 'edit') {
                this._enableEdit();
            } else {
                this._disableEdit();
            }
        },
        
        _checkSession: function() {
            if (!Modernizr.sessionstorage) {
                return;
            }
            
            if (sessionStorage.getItem('Midgard.create.toolbar')) {
                this._setOption('toolbar', sessionStorage.getItem('Midgard.create.toolbar'));
            }
            
            if (sessionStorage.getItem('Midgard.create.state')) {
                this._setOption('state', sessionStorage.getItem('Midgard.create.state'));
            }
            
            this.element.bind('midgardcreatestatechange', function(event, state) {
                sessionStorage.setItem('Midgard.create.state', state);
            });
        },
        
        _saveButton: function() {
            if (this.options.saveButton) {
                return this.options.saveButton;
            }
            
            jQuery('#midgard-bar .toolbarcontent-right').append(jQuery('<button id="midgardcreate-save">Save</button>'));
            this.options.saveButton = jQuery('#midgardcreate-save');
            this.options.saveButton.button({disabled: true})
            return this.options.saveButton;
        },
        
        _editButton: function() {
            var widget = this;
            jQuery('#midgard-bar .toolbarcontent-right').append(jQuery('<input type="checkbox" id="midgardcreate-edit" /><label for="midgardcreate-edit">Edit</label>'));
            var editButton = jQuery('#midgardcreate-edit').button();
            if (this.options.state === 'edit') {
                editButton.attr('checked', true);
                editButton.button('refresh');
            }
            editButton.bind('change', function() {
                if (editButton.attr('checked')) {
                    widget._enableEdit();
                    return;
                }
                widget._disableEdit();
            });
        },
        
        _enableToolbar: function() {
            var widget = this;
            this.element.bind('midgardtoolbarstatechange', function(event, options) {
                if (Modernizr.sessionstorage) {
                    sessionStorage.setItem('Midgard.create.toolbar', options.display);
                }
                widget._setOption('toolbar', options.display);
            });

            this.element.midgardToolbar({display: this.options.toolbar, vie: this.vie});
        },
        
        _enableEdit: function() {
            var widget = this;
            jQuery('[about]').each(function() {
                var element = this;
                var highlightEditable = function(event, options) {
                    if (options.entityElement.get(0) !== element) {
                        // Propagated event from another entity, ignore
                        return;
                    }

                    // Highlight the editable
                    options.element.effect('highlight', {color: widget.options.highlightColor}, 3000);
                };
                
                jQuery(this).bind('midgardeditableenableproperty', highlightEditable);
                jQuery(this).bind('midgardeditabledisable', function() {
                    jQuery(this).unbind('midgardeditableenableproperty', highlightEditable);
                });
                jQuery(this).midgardEditable({disabled: false, vie: widget.vie});
            });
            this._setOption('state', 'edit');
            this._trigger('statechange', null, 'edit');
        },
        
        _disableEdit: function() {
            var widget = this;
            jQuery('[about]').each(function() {
                jQuery(this).midgardEditable({disabled: true, vie: widget.vie}).removeClass('ui-state-disabled');
            });
            this._setOption('state', 'browse');
            this._trigger('statechange', null, 'browse');
        }
    })
})(jQuery);
