(function(jQuery, undefined) {
    jQuery.widget('Midgard.midgardToolbar', {
        options: {
            display: 'full',
            statechange: function() {}
        },
    
        _create: function() {
            this.element.append(this._getMinimized().hide());
            this.element.append(this._getFull());
            
            var widget = this;
            jQuery('#midgard-bar-minimized').click(function() {
                widget.show();
                widget._trigger('statechange', null, {display: 'full'});
            });
            jQuery('#midgard-bar-hidebutton').click(function() {
                widget.hide();
                widget._trigger('statechange', null, {display: 'minimized'});
            });
            
            this._setDisplay(this.options.display);
            
            this._createWorkflowsHolder();
            widget = this;
            
            jQuery(this.element).bind('midgardcreatestatechange', function(event, options) {
                if (options.state == 'browse') {
                    widget._clearWorkflows();
                }
            });
            
            jQuery(this.element).bind('midgardworkflowschanged', function(event, options) {
                widget._clearWorkflows();
                if (options.workflows.length) {
                    options.workflows.each(function(workflow) {
                        html = jQuery('body').data().midgardWorkflows.prepareItem(model, workflow, function(err, model) {
                            widget._clearWorkflows();
                            if (err) {
                                //console.log('WORKFLOW ACTION FAILED',err);
                                return;
                            }
                            //console.log('WORKFLOW ACTION FINISHED');
                        });
                        jQuery('.workflows-holder', this.element).append(html);
                    });
                }
            });
        },
        
        _setOption: function(key, value) {
            if (key === 'display') {
                this._setDisplay(value);
            }
            this.options[key] = value;
        },
        
        _setDisplay: function(value) {
            if (value === 'minimized') {
                this.hide();
            } else {
                this.show();
            } 
        },
        
        hide: function() {
            jQuery('#midgard-bar:visible', this.element).slideToggle();
            jQuery('#midgard-bar-minimized:hidden', this.element).slideToggle();
        },
        
        show: function() {
            jQuery('#midgard-bar-minimized:visible', this.element).slideToggle();
            jQuery('#midgard-bar:hidden', this.element).slideToggle();
        },
        
        _getMinimized: function() {
            return jQuery('<a id="midgard-bar-minimized" class="midgard-create ui-widget-showbut"></a>');
        },
        
        _getFull: function() {
            return jQuery('<div class="midgard-create" id="midgard-bar"><div class="ui-widget-content"><div class="toolbarcontent"><div class="midgard-logo-button"><a id="midgard-bar-hidebutton" class="ui-widget-hidebut"></a></div><div class="toolbarcontent-left"></div><div class="toolbarcontent-center"></div><div class="toolbarcontent-right"></div></div></div>');
        },
        
        _createWorkflowsHolder: function() {
            if (jQuery('.workflows-holder', this.element).length) {
                return;
            }
            jQuery('.toolbarcontent-center', this.element).append('<div class="workflows-holder" />');
        },
        
        _clearWorkflows: function() {
            jQuery('.workflows-holder', this.element).empty();
        }        
    });
})(jQuery);
