(function(jQuery, undefined) {
    jQuery.widget('Midgard.midgardEditable', {
        options: {
            editables: [],
            model: null,
            editorOptions:{},
            // the available widgets by data type
            // TODO: needs a comprehensive list of types and their appropriate widgets
            widgets: {
              	'Text': 'halloWidget',
              	'default': 'halloWidget'
            },
            // returns the name of the widget to use for the given property
            widgetName: function(data) {
              	// TODO: make sure type is already loaded into VIE
              	var propertyType = 'default';
              	var type=this.model.get('@type');
              	if (type){
                		if (type.attributes && type.attributes.get(data.property)){
                			  propertyType=type.attributes.get(data.property).range[0];
                		}
              	}
              	if (this.widgets[propertyType]){
              		  return this.widgets[propertyType];
              	}
              	return this.widgets['default'];
            },
            enableEditor: function(data) {
              	var widgetName=this.widgetName(data);
              	jQuery(data.element)[widgetName](data);
              	jQuery(data.element).data('createWidgetName',widgetName);
              	return jQuery(data.element);
            },
            disableEditor: function(data) {
              	var widgetName=jQuery(data.element).data('createWidgetName');
              	if (widgetName){
                	    // only if there has been an editing widget registered
                    	jQuery(data.element)[widgetName]('disable');
                }
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
                    entity: widget.options.model,
                    element: jQuery(this)
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
