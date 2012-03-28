/**
 * Extend this base for any editing widget.
 */
(function (jQuery, undefined) {
  jQuery.widget('Create.editWidget', {
    options: {
      disabled: false,
      vie: null
    },
    // override to enable the widget
    enable: function () {
      this.element.attr('contenteditable', 'true');
    },
    // override to disable the widget
    disable: function (disable) {
      this.element.attr('contenteditable', 'false');
    },
    // called by the jquery ui plugin factory when creating the widget
    _create: function () {
      this._registerWidget();
      this._initialize();
    },
    _init: function () {
      if (this.options.disabled) {
        this.disable();
        return;
      }
      this.enable();
    },
    // override this function to initialize the widget functions
    _initialize: function () {
      var self = this;
      var before = this.element.html();
      this.element.bind('blur keyup paste', function (event) {
        console.log("checking for modifications");
        if (self.options.disabled) {
          console.log("widget is disabled");
          return;
        }
        var current = jQuery(this).html();
        if (before !== current) {
          console.log("element content has been modified");
          before = current;
          self.options.modified(current);
        }
      });
    },
    // used to register the widget name with the DOM element
    _registerWidget: function () {
      this.element.data("createWidgetName", this.widgetName);
    }
  });
})(jQuery);
