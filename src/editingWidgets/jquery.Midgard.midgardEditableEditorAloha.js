(function (jQuery, undefined) {
  jQuery.widget('Create.alohaWidget', jQuery.Create.editWidget, {
    enable: function () {
      this._initialize();
      this.options.disabled = false;
    },
    disable: function () {
      try {
        options.editable.destroy();
      } catch (err) {}
      this.options.disabled = true;
    },
    _initialize: function () {
      var options = this.options;
      var editable = new Aloha.Editable(Aloha.jQuery(options.element.get(0)));
      editable.vieEntity = options.entity;

      // Subscribe to activation and deactivation events
      Aloha.bind('aloha-editable-activated', function () {
        options.activated();
      });
      Aloha.bind('aloha-editable-deactivated', function () {
        options.deactivated();
      });

      Aloha.bind('aloha-smart-content-changed', function () {
        if (!editable.isModified()) {
          return true;
        }
        options.modified(editable.getContents());
        editable.setUnmodified();
      });
    }
  });
})(jQuery);
