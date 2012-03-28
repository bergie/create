(function (jQuery, undefined) {
  jQuery.widget('Midgard.midgardToolbar', {
    options: {
      display: 'full',
      statechange: function () {}
    },

    _create: function () {
      this.element.append(this._getMinimized());
      this.element.append(this._getFull());

      var widget = this;
      jQuery('.create-ui-toggle').click(function () {
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

      this._createWorkflowsHolder();
      widget = this;

      jQuery(this.element).bind('midgardcreatestatechange', function (event, options) {
        if (options.state == 'browse') {
          widget._clearWorkflows();
        }
      });

      jQuery(this.element).bind('midgardworkflowschanged', function (event, options) {
        widget._clearWorkflows();
        if (options.workflows.length) {
          options.workflows.each(function (workflow) {
            html = jQuery('body').data().midgardWorkflows.prepareItem(model, workflow, function (err, model) {
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

    _setOption: function (key, value) {
      if (key === 'display') {
        this._setDisplay(value);
      }
      this.options[key] = value;
    },

    _setDisplay: function (value) {
      if (value === 'minimized') {
        this.hide();
      } 
    },

    hide: function () {
      jQuery('div.create-ui-toolbar-wrapper').fadeToggle('fast', 'linear');
    },

    show: function () {
      jQuery('div.create-ui-toolbar-wrapper').fadeToggle('fast', 'linear');
    },

    _getMinimized: function () {
      return jQuery('<div class="create-ui-logo"><a class="create-ui-toggle" id="create-ui-toggle-toolbar"></a></div>');
    },

    _getFull: function () {
      return jQuery('<div class="create-ui-toolbar-wrapper"><div class="create-ui-toolbar-toolarea"><div class="create-ui-toolbar-dynamictoolarea"><ul class="create-ui-dynamictools create-ui-toolset-1"><li class="create-ui-tool-freearea"></li></ul></div><div class="create-ui-toolbar-statustoolarea"><ul class="create-ui-statustools"></ul></div></div></div>');
    },

    _createWorkflowsHolder: function () {
      if (jQuery('.workflows-holder', this.element).length) {
        return;
      }
      jQuery('.toolbarcontent-center', this.element).append('<div class="workflows-holder" />');
    },

    _clearWorkflows: function () {
      jQuery('.workflows-holder', this.element).empty();
    }
  });
})(jQuery);
