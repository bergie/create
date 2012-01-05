(function(jQuery, undefined) {
    
    jQuery.widget('Midgard.midgardWorkflows', {
        options: {
            url: function(model){}
        },
        
        _init: function() {
          this._last_instance = null;
          
          this.ModelWorkflowModel = Backbone.Model.extend({
              defaults: {
                  name: '',
                  label: '',
                  type: 'button',
                  action: ''          
              }
          });
          
          this.workflows = {};
          
          var widget = this;          
          jQuery(this.element).bind('midgardeditableactivated', function(event, options) {
              model = options.instance;
            
              if (widget._last_instance == model) {
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
                  flows = new (widget._generateCollectionFor(model))();
                  widget._trigger('changed', null, {
                      instance: model,
                      workflows: flows
                  });
              }
          });
        },
        
        _generateCollectionFor: function(model) {
            collection = Backbone.Collection.extend({
                model: this.ModelWorkflowModel,
                url: this.options.url(model)
            });
            return collection;
        },
        
        _fetchModelWorkflows: function(model) {          
          var widget = this;
          
          widget.workflows[model.cid] = new (this._generateCollectionFor(model))();
          widget.workflows[model.cid].fetch({
              success: function(collection) {
                  widget.workflows[model.cid].reset(collection);

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