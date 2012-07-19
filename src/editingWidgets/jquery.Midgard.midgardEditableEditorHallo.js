//     Create.js - On-site web editing interface
//     (c) 2012 Tobias Herrmann, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  // # Hallo editing widget
  //
  // This widget allows editing textual content areas with the
  // [Hallo](http://hallojs.org) rich text editor.
  jQuery.widget('Create.halloWidget', jQuery.Create.editWidget, {
    options: {
      editorOptions: {},
      disabled: true,
      toolbarState: 'full',
      vie: null,
      entity: null
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
          hallolists: {},
          hallolink: {},
          halloimage: {
            entity: this.options.entity
          },
          halloindicator: {}
        },
        buttonCssClass: 'create-ui-btn-small',
        placeholder: '[' + this.options.property + ']'
      };

      if (typeof this.element.annotate === 'function' && this.options.vie.services.stanbol) {
        // Enable Hallo Annotate plugin by default if user has annotate.js
        // loaded and VIE has Stanbol enabled
        defaults.plugins.halloannotate = {
            vie: this.options.vie
        };
      }

      if (this.options.toolbarState === 'full') {
        // Use fixed toolbar in the Create tools area
        defaults.parentElement = jQuery('.create-ui-toolbar-dynamictoolarea .create-ui-tool-freearea');
        defaults.toolbar = 'halloToolbarFixed';
      } else {
        // Tools area minimized, use floating toolbar
        defaults.showAlways = false;
        defaults.toolbar = 'halloToolbarContextual';
      }
      return _.extend(defaults, this.options.editorOptions);
    }
  });
})(jQuery);
