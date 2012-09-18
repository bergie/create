//     Create.js - On-site web editing interface
//     (c) 2011-2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false */
  'use strict';

  jQuery.widget('Midgard.midgardToolbar', {
    options: {
      display: 'full',
      templates: {
        minimized: '<div class="create-ui-logo"><a class="create-ui-toggle" id="create-ui-toggle-toolbar"></a></div>',
        full: '<div class="create-ui-toolbar-wrapper"><div class="create-ui-toolbar-toolarea"><%= dynamic %><%= status %></div></div>',
        toolcontainer: '<div class="create-ui-toolbar-<%= name %>toolarea"><ul class="create-ui-<%= name %>tools"><%= content %></ul></div>',
        toolarea: '<li class="create-ui-tool-<%= name %>area"></li>'
      }
    },

    _create: function () {
      this.element.append(this._getMinimized());
      this.element.append(this._getFull());

      var widget = this;
      jQuery('.create-ui-toggle', this.element).click(function () {
        if (widget.options.display === 'full') {
          widget.hide();
          widget.options.display = 'minimized';
        } else {
          widget.show();
          widget.options.display = 'full';
        }
        widget._trigger('statechange', null, widget.options);
      });

      this._setDisplay(this.options.display);

      widget = this;

      jQuery(this.element).bind('midgardcreatestatechange', function (event, options) {
        if (options.state == 'browse') {
          widget._clearWorkflows();
          widget._clearMetadata();
        }
      });

      jQuery(this.element).bind('midgardworkflowschanged', function (event, options) {
        widget._clearWorkflows();
        if (options.workflows.length) {
          options.workflows.each(function (workflow) {
            var html = jQuery('body').data().midgardWorkflows.prepareItem(options.instance, workflow, function (err, model) {
              widget._clearWorkflows();
              if (err) {
                return;
              }
            });
            jQuery('.create-ui-tool-workflowarea', this.element).append(html);
          });
        }
      });
    },

    _setOption: function (key, value) {
      if (key === 'display') {
        this._setDisplay(value);
      }
      this.options[key] = value;
    },

    _setDisplay: function (value) {
      if (value === 'minimized') {
        jQuery('div.create-ui-toolbar-wrapper').hide();
      } 
    },

    hide: function () {
      jQuery('div.create-ui-toolbar-wrapper').fadeToggle('fast', 'linear');
    },

    show: function () {
      jQuery('div.create-ui-toolbar-wrapper').fadeToggle('fast', 'linear');
    },

    _getMinimized: function () {
      return jQuery(_.template(this.options.templates.minimized, {}));
    },

    _getFull: function () {
      return jQuery(_.template(this.options.templates.full, {
        dynamic: _.template(this.options.templates.toolcontainer, {
          name: 'dynamic',
          content:
            _.template(this.options.templates.toolarea, {
              name: 'metadata'
            }) +
            _.template(this.options.templates.toolarea, {
              name: 'workflow'
            }) +
            _.template(this.options.templates.toolarea, {
              name: 'free'
            })
        }),
        status: _.template(this.options.templates.toolcontainer, {
          name: 'status',
          content: ''
        })
      }));
    },

    _clearWorkflows: function () {
      jQuery('.create-ui-tool-workflowarea', this.element).empty();
    },

    _clearMetadata: function () {
      jQuery('.create-ui-tool-metadataarea', this.element).empty();
    }
  });
})(jQuery);
