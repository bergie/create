(function(jQuery, undefined) {
    
    jQuery.widget('Midgard.midgardWorkflows', {
        options: {
            url: function(model){},
            renderers: {
              button: function(model, workflow, action_cb, final_cb) {
                  button_id = 'midgardcreate-workflow_' + workflow.get('name');
                  html = jQuery('<button id="'+button_id+'">'+workflow.get('label')+'</button>').button();

                  html.bind('click', function(evt) {
                      action_cb(model, workflow, final_cb);
                  });
                  return html;
              }
            },
            action_types: {
                backbone_save: function(model, workflow, callback) {
                    copy_of_url = model.url;
                    original_model = model.clone();
                    original_model.url = copy_of_url;

                    action = workflow.get("action")
                    if (action.url) {
                        model.url = action.url                        
                    }
                    original_model.save(null, {
                        success: function(m) {
                            model.url = copy_of_url;
                            model.change();
                            callback(null, model);
                        },
                        error: function(m, err) {
                            model.url = copy_of_url;
                            model.change();
                            callback(err, model);
                        }
                    });
                },
                backbone_destroy: function(model, workflow, callback) {
                    copy_of_url = model.url;
                    original_model = model.clone();
                    original_model.url = copy_of_url;
                    
                    action = workflow.get("action")
                    if (action.url) {
                        model.url = action.url
                    }

                    model.destroy({
                        success: function(m) {
                            model.url = copy_of_url;
                            model.change();
                            callback(null, m);
                        },
                        error: function(m, err) {
                            model.url = copy_of_url;
                            model.change();
                            callback(err, model);
                        }
                    });
                },
                http: function(model, workflow, callback) {
                    action = workflow.get("action")
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
                        success: function() {
                            model.fetch({
                              success: function(model) {
                                  callback(null, model);
                              },
                              error: function(model, err) {
                                  callback(err, model);
                              }
                            });
                        }
                    }, wf_opts);
                    
                    jQuery.ajax(ajax_options);
                }
            }
        },
        
        _init: function() {
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
            jQuery(this.element).bind('midgardeditableactivated', function(event, options) {
                model = options.instance;
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
                    flows = new (widget._generateCollectionFor(model))([], {});
                    widget._trigger('changed', null, {
                        instance: model,
                        workflows: flows
                    });
                }
            });
        },
        
        _parseRenderersAndTypes: function() {
            var widget = this;
            jQuery.each(this.options.renderers, function(k, v) {
                widget.setRenderer(k, v);
            });
            jQuery.each(this.options.action_types, function(k, v) {
                widget.setActionType(k, v);
            });
        },
        
        setRenderer: function(name, callbacks) {
            this._renderers[name] = callbacks;
        },
        getRenderer: function(name) {
            if (!this._renderers[name]) {
                return false;
            }
            
            return this._renderers[name];
        },
        setActionType: function(name, callback) {
            this._action_types[name] = callback;
        },
        getActionType: function(name) {
            return this._action_types[name];
        },
        
        prepareItem: function(model, workflow, final_cb) {
            var widget = this;

            renderer = this.getRenderer(workflow.get("type"));
            action_type_cb = this.getActionType(workflow.get("action").type);
            
            return renderer(model, workflow, action_type_cb, function(err, m) {
                delete widget.workflows[model.cid];
                widget._last_instance = null;
                
                final_cb(err, m);
            });
        },
        
        _generateCollectionFor: function(model) {
            var collectionSettings = {
                model: this.ModelWorkflowModel
            };
            if (this.options.url) {
                collectionSettings['url'] = this.options.url(model);
            }
            return Backbone.Collection.extend(collectionSettings);
        },
        
        _fetchModelWorkflows: function(model) {          
          var widget = this;
          
          widget.workflows[model.cid] = new (this._generateCollectionFor(model))([], {});
          widget.workflows[model.cid].fetch({
              success: function(collection) {
                  widget.workflows[model.cid].reset(collection.models);

                  widget._trigger('changed', null, {
                      instance: model,
                      workflows: widget.workflows[model.cid]
                  });
              },
              error: function(model, err) {
                  console.log('error fetching flows',err);
              }
            });
        }
    });
})(jQuery);
