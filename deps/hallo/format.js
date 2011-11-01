(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  (function(jQuery) {
    return jQuery.widget("IKS.halloformat", {
      options: {
        editable: null,
        toolbar: null,
        uuid: "",
        formattings: ["bold", "italic", "strikeThrough", "underline"]
      },
      _create: function() {
        var buttonize, buttonset, format, widget, _i, _len, _ref;
        widget = this;
        buttonset = jQuery("<span class=\"" + widget.widgetName + "\"></span>");
        buttonize = __bind(function(format) {
          var button, id, label;
          label = format.substr(0, 1).toUpperCase();
          id = "" + this.options.uuid + "-" + format;
          buttonset.append(jQuery("<input id=\"" + id + "\" type=\"checkbox\" /><label for=\"" + id + "\">" + label + "</label>").button());
          button = jQuery("#" + id, buttonset);
          button.attr("hallo-command", format);
          button.bind("change", function(event) {
            format = jQuery(this).attr("hallo-command");
            return widget.options.editable.execute(format);
          });
          return this.element.bind("keyup paste change mouseup", function(event) {
            if (document.queryCommandState(format)) {
              button.attr("checked", true);
              return button.button("refresh");
            } else {
              button.attr("checked", false);
              return button.button("refresh");
            }
          });
        }, this);
        _ref = this.options.formattings;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          format = _ref[_i];
          buttonize(format);
        }
        buttonset.buttonset();
        return this.options.toolbar.append(buttonset);
      },
      _init: function() {}
    });
  })(jQuery);
}).call(this);
