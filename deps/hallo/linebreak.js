(function() {
  (function(jQuery) {
    return jQuery.widget("IKS.hallolinebreak", {
      options: {
        editable: null,
        toolbar: null,
        uuid: "",
        after: []
      },
      _create: function() {
        var buttonset, buttonsets, queuedButtonsets, row, rowcounter, _i, _j, _len, _len2, _ref;
        buttonsets = jQuery('.ui-buttonset', this.options.toolbar);
        queuedButtonsets = jQuery();
        rowcounter = 0;
        _ref = this.options.after;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          row = _ref[_i];
          rowcounter++;
          for (_j = 0, _len2 = buttonsets.length; _j < _len2; _j++) {
            buttonset = buttonsets[_j];
            queuedButtonsets = jQuery(queuedButtonsets).add(jQuery(buttonset));
            if (jQuery(buttonset).hasClass(row)) {
              queuedButtonsets.wrapAll('<div class="halloButtonrow halloButtonrow-' + rowcounter + '" />');
              buttonsets = buttonsets.not(queuedButtonsets);
              queuedButtonsets = jQuery();
              break;
            }
          }
        }
        if (buttonsets.length > 0) {
          rowcounter++;
          return buttonsets.wrapAll('<div class="halloButtonrow halloButtonrow-' + rowcounter + '"" />');
        }
      },
      _init: function() {}
    });
  })(jQuery);
}).call(this);
