(function(jQuery, undefined) {
    jQuery.widget('Midgard.midgardStorage', {
        options: {
            localStorage: false,
            vie: null,
            changedModels: [],
            loaded: function() {},
            url: ''
        },
    
        _create: function() {
            var widget = this;
            
            if (Modernizr.localstorage) {
                this.options.localStorage = true;
            }

            this.vie = this.options.vie;

            this.vie.entities.bind('add', function(model) {
                // Add the back-end URL used by Backbone.sync
                model.url = widget.options.url;
                model.toJSON = model.toJSONLD;
            });
            
            jQuery('#midgardcreate-save').click(function() {
                widget._saveRemote({
                    success: function() {
                        jQuery('#midgardcreate-save').button({disabled: true});
                    },
                    error: function() {
                    }
                });
            });
            
            widget._bindEditables();
        },
        
        _bindEditables: function() {
            var widget = this;

            widget.element.bind('midgardeditablechanged', function(event, options) {
                if (_.indexOf(widget.options.changedModels, options.instance) === -1) {
                    widget.options.changedModels.push(options.instance);
                }
                widget._saveLocal(options.instance);
                jQuery('#midgardcreate-save').button({disabled: false});
            });
            
            widget.element.bind('midgardeditabledisable', function(event, options) {
                widget._restoreLocal(options.instance);
                jQuery('#midgardcreate-save').button({disabled: true});
            });
            
            widget.element.bind('midgardeditableenable', function(event, options) {
                if (options.instance.id) {
                    widget._readLocal(options.instance);
                }
                _.each(options.instance.attributes, function(attributeValue, property) {
                    if (attributeValue instanceof widget.vie.Collection) {
                        //widget._readLocalReferences(options.instance, property, attributeValue);
                    }
                });
            });
            
            widget.element.bind('midgardstorageloaded', function(event, options) {
                if (_.indexOf(widget.options.changedModels, options.instance) === -1) {
                    widget.options.changedModels.push(options.instance);
                }
                jQuery('#midgardcreate-save').button({disabled: false});
            });
        },
        
        _saveRemote: function(options) {
            var widget = this;
            widget._trigger('save', null, {
                models: widget.options.changedModels
            });
            var needed = widget.options.changedModels.length;
            if (needed > 1) {
                notification_msg = needed + ' objects saved successfully';
            } else {
                subject = widget.options.changedModels[0].getSubject().toString();
                subject = subject.replace('<', '&lt;').replace('>', '&gt;');
                notification_msg = 'Object with subject '+subject+' saved successfully';
            }
            
            _.forEach(widget.options.changedModels, function(model, index) {
                model.save(null, {
                    success: function() {
                        if (model.originalAttributes) {
                            // From now on we're going with the values we have on server
                            delete model.originalAttributes;
                        }
                        widget._removeLocal(model);
                        widget.options.changedModels.splice(index, 1);
                        needed--;
                        if (needed <= 0) {                            
                            // All models were happily saved
                            widget._trigger('saved', null, {});
                            options.success();
                            jQuery('body').data('midgardCreate').showNotification({body: notification_msg});
                        }
                    },
                    error: function(m, err) {                        
                        notification_msg = 'Error occurred while saving';
                        if (err.responseText) {
                            notification_msg = notification_msg + ':<br />' + err.responseText;
                        }
                        
                        options.error();
                        jQuery('body').data('midgardCreate').showNotification({body: notification_msg});
                    }
                });
            });
        },

        _saveLocal: function(model) {
            if (!this.options.localStorage) {
                return;
            }

            if (typeof model.id === 'object') {
                // Anonymous object, save as refs instead
                if (!model.primaryCollection) {
                    return;
                }
                return this._saveLocalReferences(model.primaryCollection.subject, model.primaryCollection.predicate, model);
            }
            localStorage.setItem(model.getSubject(), JSON.stringify(model.toJSONLD()));
        },
        
        _getReferenceId: function(model, property) {
            return model.id + ':' + property;
        },
        
        _saveLocalReferences: function(subject, predicate, model) {
            if (!this.options.localStorage) {
                return;
            }
            
            if (!subject ||
                !predicate) {
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

        _readLocal: function(model) {
            if (!this.options.localStorage) {
                return;
            }
            
            var local = localStorage.getItem(model.getSubject());
            if (!local) {
                return;
            }
            if (!model.originalAttributes) {
              model.originalAttributes = _.clone(model.attributes);
            }
            var entity = this.vie.EntityManager.getByJSONLD(JSON.parse(local));
            
            this._trigger('loaded', null, {
                instance: entity
            });
        },
        
        _readLocalReferences: function(model, property, collection) {
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
        
        _restoreLocal: function(model) {
            var widget = this;
            // Remove unsaved collection members
            _.each(model.attributes, function(attributeValue, property) {
                if (attributeValue instanceof widget.vie.Collection) {
                    attributeValue.forEach(function(model) {
                        if (!model.id) {
                            attributeValue.remove(model);
                        }
                    });
                }
            });
            
            // Restore original object properties
            if (jQuery.isEmptyObject(model.changedAttributes())) {
                if (model.originalAttributes) {
                    model.set(model.originalAttributes);
                    delete model.originalAttributes;
                }
                return;
            }
            model.set(model.previousAttributes());
        },
        
        _removeLocal: function(model) {
            if (!this.options.localStorage) {
                return;
            }
            
            localStorage.removeItem(model.getSubject());
        }
    });
})(jQuery);
