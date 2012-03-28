(function (jQuery, undefined) {
  jQuery.widget('Create.halloWidget', jQuery.Create.editWidget, {
    options: {
      disabled: true,
      toolbarState: 'full'
    },
    enable: function () {
      jQuery(this.element).hallo({
        editable: true
      });
      this.options.disabled = false;
    },
    disable: function () {
      jQuery(this.element).hallo({
        editable: false
      });
      this.options.disabled = true;
    },
    _initialize: function () {
      jQuery(this.element).hallo(this.getHalloOptions());
      var self = this;
      jQuery(this.element).bind('halloactivated', function (event, data) {
        self.options.activated();
      });
      jQuery(this.element).bind('hallodeactivated', function (event, data) {
        self.options.deactivated();
      });
      jQuery(this.element).bind('hallomodified', function (event, data) {
        self.options.modified(data.content);
        data.editable.setUnmodified();
      });

      jQuery(document).bind('midgardtoolbarstatechange', function(event, data) {
        // Switch between Hallo configurations when toolbar state changes
        if (data.display === self.options.toolbarState) {
          return;
        }
        self.options.toolbarState = data.display;
        jQuery(self.element).hallo(self.getHalloOptions());
      });
    },

    getHalloOptions: function() {
      var defaults = {
        plugins: {
          halloformat: {},
          halloblock: {},
          hallolists: {}
        },
        buttonCssClass: 'create-ui-btn-small',
        placeholder: '[' + this.options.property + ']'
      };

      if (this.options.toolbarState === 'full') {
        // Use fixed toolbar in the Create tools area
        defaults.parentElement = jQuery('.create-ui-toolbar-dynamictoolarea .create-ui-tool-freearea');
        defaults.showAlways = true;
        defaults.fixed = true;
      } else {
        // Tools area minimized, use floating toolbar
        defaults.showAlways = false;
        defaults.fixed = false;
      }

      var editorOptions = {};
      if (this.options.editorOptions[this.options.property]) {
        editorOptions = this.options.editorOptions[this.options.property];
      } else if (this.options.editorOptions['default']) {
        editorOptions = this.options.editorOptions['default'];
      }
      return _.extend(defaults, editorOptions);
    }
  });
})(jQuery);
