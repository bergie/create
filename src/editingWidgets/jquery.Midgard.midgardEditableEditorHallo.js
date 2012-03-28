(function (jQuery, undefined) {
  jQuery.widget('Create.halloWidget', jQuery.Create.editWidget, {
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
      var defaultOptions = {
        plugins: {
          halloformat: {},
          halloblock: {},
          hallolists: {}
        },
        editable: true,
        placeholder: '[' + this.options.property + ']',
        parentElement: jQuery('.create-ui-toolbar-dynamictoolarea .create-ui-tool-freearea'),
        showAlways: true,
        fixed: true
      };
      var editorOptions = {};
      if (this.options.editorOptions[this.options.property]) {
        editorOptions = this.options.editorOptions[this.options.property];
      } else if (this.options.editorOptions['default']) {
        editorOptions = this.options.editorOptions['default'];
      }
      jQuery.extend(defaultOptions, editorOptions);
      jQuery(this.element).hallo(defaultOptions);
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
    }
  });
})(jQuery);
