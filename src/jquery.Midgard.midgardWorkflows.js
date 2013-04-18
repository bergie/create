/*
//     Create.js - On-site web editing interface
//     (c) 2012 Jerry Jalava, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
*/
(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false Backbone:false */
  'use strict';

  jQuery.widget('Midgard.midgardWorkflows', {
    options: {
      url: function (model) {},
      templates: {
        button: '<button class="create-ui-btn" id="<%= id %>"><%= label %></button>'
      },
      renderers: {
        button: function (model, workflow, action_cb, final_cb) {
          var button_id = 'midgardcreate-workflow_' + workflow.get('name');
          var html = jQuery(_.template(this.options.templates.button, {
            id: button_id,
            label: workflow.get('label')
          })).button();

          html.on('click', function (evt) {
            action_cb(model, workflow, final_cb);
          });
          return html;
        }
      },
      action_types: {
        backbone_save: function (model, workflow, callback) {
          var copy_of_url = model.url;
          var original_model = model.clone();
          original_model.url = copy_of_url;

          var action = workflow.get('action');
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
          var copy_of_url = model.url;
          var original_model = model.clone();
          original_model.url = copy_of_url;

          var action = workflow.get('action');
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
          var action = workflow.get('action');
          if (!action.url) {
            return callback('No action url defined!');
          }

          var wf_opts = {};
          if (action.http) {
            wf_opts = action.http;
          }

          var ajax_options = jQuery.extend({
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
      jQuery(this.element).on('midgardeditableactivated', function (event, options) {
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
        var flows = new(widget._generateCollectionFor(model))([], {});
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

      var renderer = this.getRenderer(workflow.get("type"));
      var action_type_cb = this.getActionType(workflow.get("action").type);

      return renderer.call(this, model, workflow, action_type_cb, function (err, m) {
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
