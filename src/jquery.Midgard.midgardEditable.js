(function(jQuery, undefined) {
    jQuery.widget('Midgard.midgardEditable', {
        options: {
            editables: [],
            model: null,
            editor: 'hallo',
            editorOptions: {},
            // Override this if you want to use custom widgets for editing
            enableEditor: function(data) {
              if (data.widget.options.editor === 'aloha') {
                return data.widget._enableAloha(data);
              }
              return data.widget._enableHallo(data);
            },
            // Override this if you want to use custom widgets for editing
            disableEditor: function(data) {
              if (data.widget.options.editor === 'aloha') {
                data.widget._disableAloha(data);
                return;
              }
              data.widget._disableHallo(data);
            },
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
              widget.options.disableEditor({
                widget: widget,
                editable: editable,
                entity: widget.options.model
              });
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
            var widget = this;
            var propertyName = this.vie.RDFa.getPredicate(element);
            if (!propertyName) {
                return true;
            }
            if (this.options.model.get(propertyName) instanceof Array) {
                // For now we don't deal with multivalued properties in the editable
                return true;
            }

            var editable = this.options.enableEditor({
                widget: this,
                element: element,
                entity: this.options.model,
                property: propertyName,
                editorOptions: this.options.editorOptions,
                modified: function(content) {
                    var changedProperties = {};
                    changedProperties[propertyName] = content;
                    widget.options.model.set(changedProperties, {silent: true});
                    widget._trigger('changed', null, {
                        property: propertyName,
                        instance: widget.options.model,
                        element: element,
                        entityElement: widget.element
                    });
                },
                activated: function() {
                    widget._trigger('activated', null, {
                        property: propertyName,
                        instance: widget.options.model,
                        element: element,
                        entityElement: widget.element
                    });
                },
                deactivated: function() {
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

        _enableHallo: function(options) {
            var defaultOptions = {
                plugins: {
                    halloformat: {}
                },
                editable: true,
                placeholder: '[' + options.property + ']'
            };
            var editorOptions = {};
            if (options.editorOptions[options.property]) {
                editorOptions = options.editorOptions[options.property];
            } else if (options.editorOptions['default']) {
                editorOptions = options.editorOptions['default'];
            }
            jQuery.extend(defaultOptions, editorOptions);
            jQuery(options.element).hallo(defaultOptions);

            var widget = this;
            jQuery(options.element).bind('halloactivated', function(event, data) {
                options.activated();
            });
            jQuery(options.element).bind('hallodeactivated', function(event, data) {
                options.deactivated();
            });
            jQuery(options.element).bind('hallomodified', function(event, data) {
                options.modified(data.content);
                data.editable.setUnmodified();
            });

            return options.element;
        },

        _disableHallo: function(options) {
            jQuery(options.editable).hallo({editable: false}); 
        },

        _enableAloha: function(options) {
            var editable = new Aloha.Editable(Aloha.jQuery(options.element.get(0)));
            editable.vieEntity = options.entity;

            // Subscribe to activation and deactivation events
            var widget = this;
            Aloha.bind('aloha-editable-activated', function() {
                options.activated();
            });
            Aloha.bind('aloha-editable-deactivated', function() {
                options.deactivated();
            });

            Aloha.bind('aloha-smart-content-changed', function() {
                if (!editable.isModified()) {
                    return true;
                }
                options.modified(editable.getContents());
                editable.setUnmodified();
            });

            return editable;
        },

        _disableAloha: function(options) {
            try {
                options.editable.destroy();
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

            if (collectionView.template.length === 0) {
                // Collection view has no template and so can't add
                return;
            }

            collectionView.collection.url = widget.options.model.url();

            collectionView.bind('add', function(itemView) {
                //itemView.el.effect('slide');
                itemView.model.primaryCollection = collectionView.collection;
                itemView.el.midgardEditable({disabled: widget.options.disabled, model: itemView.model, vie: widget.vie, editor: widget.options.editor});
            });

            collectionView.collection.bind('add', function(model) {
                widget.vie.entities.add(model);
                model.collection = collectionView.collection;
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
        }
    });
})(jQuery);
