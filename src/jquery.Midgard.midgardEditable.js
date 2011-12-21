(function(jQuery, undefined) {
    jQuery.widget('Midgard.midgardEditable', {
        options: {
            editables: [],
            model: null,
            editor: 'hallo',
            editorOptions: {},
            addButton: null,
            enable: function() {},
            enableproperty: function() {},
            disable: function() {},
            activated: function() {},
            deactivated: function() {},
            changed: function() {},
            vie: null
        },
    
        _create: function() {
            this.vie = this.options.vie;
            if (!this.options.model) {
                var models = this.vie.RDFaEntities.getInstances(this.element);
                this.options.model = models[0];
            }
        },
        
        _init: function() {
            if (this.options.disabled) {
                this.disable();
                return;
            }
            this.enable();
        },
        
        enable: function() {  
            var widget = this;
            this.vie.RDFa.findPredicateElements(this.options.model.id, jQuery('[property]', this.element), false).each(function() {
                return widget._enableProperty(jQuery(this));
            });
            this._trigger('enable', null, {
                instance: this.options.model,
                entityElement: this.element
            });
            _.forEach(this.vie.services.rdfa.views, function(view) {
                if (view instanceof widget.vie.view.Collection) {
                    widget._enableCollection(view);
                }
            });
        },
        
        disable: function() {
            var widget = this;
            jQuery.each(this.options.editables, function(index, editable) {
                if (widget.options.editor === "aloha") {
                    widget._disableAloha(editable);
                    return true;
                }
                jQuery(editable).hallo({editable: false}); 
            });
            this.options.editables = [];
            
            if (this.options.addButton) {
                this.options.addButton.remove();
                delete this.options.addButton;
            }

            this._trigger('disable', null, {
                instance: this.options.model,
                entityElement: this.element
            });
        },
        
        _enableProperty: function(element) {
            var propertyName = this.vie.RDFa.getPredicate(element);
            if (!propertyName) {
                return true;
            }
            if (this.options.model.get(propertyName) instanceof Array) {
                // For now we don't deal with multivalued properties in the editable
                return true;
            }

            if (this.options.editor === "aloha") {
                return this._enableAloha(element, propertyName);
            }

            // Default to Hallo
            var options = {
                plugins: {
                    halloformat: {}
                },
                editable: true,
                placeholder: '[' + propertyName + ']'
            };
            var editorOptions = {};
            if (this.options.editorOptions[propertyName]) {
                editorOptions = this.options.editorOptions[propertyName];
            } else if (this.options.editorOptions['default']) {
                editorOptions = this.options.editorOptions['default'];
            }
            $.extend(options, editorOptions);
            jQuery(element).hallo(options);

            var widget = this;
            jQuery(element).bind('halloactivated', function(event, data) {
                widget._trigger('activated', null, {
                    editable: null,
                    property: propertyName,
                    instance: widget.options.model,
                    element: element,
                    entityElement: widget.element
                });
            });
            jQuery(element).bind('hallodeactivated', function(event, data) {
                widget._trigger('deactivated', null, {
                    editable: null,
                    property: propertyName,
                    instance: widget.options.model,
                    element: element,
                    entityElement: widget.element
                });
            });
            jQuery(element).bind('hallomodified', function(event, data) {
                var changedProperties = {};
                changedProperties[propertyName] = data.content;
                data.editable.setUnmodified();
                widget.options.model.set(changedProperties, {silent: true});

                widget._trigger('changed', null, {
                    editable: null,
                    property: propertyName,
                    instance: widget.options.model,
                    element: element,
                    entityElement: widget.element
                });
            });
            this._trigger('enableproperty', null, {
                editable: null,
                property: propertyName,
                instance: this.options.model,
                element: element,
                entityElement: this.element
            });

            this.options.editables.push(element);
        },

        _enableAloha: function(element, propertyName) {
            var editable = new GENTICS.Aloha.Editable(element);
            editable.vieEntity = this.options.model;

            // Subscribe to activation and deactivation events
            var widget = this;
            GENTICS.Aloha.EventRegistry.subscribe(editable, 'editableActivated', function() {
                widget._trigger('activated', null, {
                    editable: editable,
                    property: propertyName,
                    instance: widget.options.model,
                    element: element,
                    entityElement: widget.element
                });
            });
            GENTICS.Aloha.EventRegistry.subscribe(editable, 'editableDeactivated', function() {
                widget._trigger('deactivated', null, {
                    editable: editable,
                    property: propertyName,
                    instance: widget.options.model,
                    element: element,
                    entityElement: widget.element
                });
            });

            // Register a timer to copy any modified contents
            // TODO: Replace with smartContentChange when Aloha .10 is out
            editable.changeTimer = window.setInterval(function() {
                widget._checkModified(propertyName, editable);
            }, 2000);

            this._trigger('enableproperty', null, {
                editable: editable,
                property: propertyName,
                instance: this.options.model,
                element: element,
                entityElement: this.element
            });
            
            this.options.editables.push(editable);
        },

        _disableAloha: function(editable) {
            editable.setUnmodified();
            
            if (typeof editable.changeTimer !== 'undefined') {
                window.clearInterval(editable.changeTimer);
            }

            try {
                editable.destroy();
            } catch (err) {
            }
        },
        
        _enableCollection: function(collectionView) {
            var widget = this;

            if (!collectionView.owner || collectionView.owner.getSubject() !== widget.options.model.getSubject()) {
                return;
            }

            if (widget.options.addButton) {
                return;
            }

            collectionView.bind('add', function(itemView) {
                //itemView.el.effect('slide');
                itemView.model.primaryCollection = collectionView.collection;
                itemView.el.midgardEditable({disabled: widget.options.disabled, model: itemView.model, vie: widget.vie, editor: widget.options.editor});
            });
            
            collectionView.bind('remove', function(itemView) {
                //itemView.el.hide('drop');
            });
            
            widget.options.addButton = jQuery('<button>Add</button>').button();
            widget.options.addButton.addClass('midgard-create-add');
            widget.options.addButton.click(function() {
                collectionView.collection.add({});
            });
            
            collectionView.el.after(widget.options.addButton);
        },
        
        _checkModified: function(propertyName, editable) {
            if (!editable.isModified()) {
                return true;
            }
            var changedProperties = {};
            changedProperties[propertyName] = editable.getContents();
            editable.setUnmodified();
            this.options.model.set(changedProperties, {silent: true});
            
            this._trigger('changed', null, {
                editable: editable,
                property: propertyName,
                instance: this.options.model,
                element: editable.obj,
                entityElement: this.element
            });
        }
    });
})(jQuery);
