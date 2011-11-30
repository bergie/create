
  (function(jQuery) {
    return jQuery.widget("IKS.halloformat", {
      options: {
        editable: null,
        toolbar: null,
        uuid: "",
        formattings: {
          bold: true,
          italic: true,
          strikeThrough: true,
          underline: true
        }
      },
      _create: function() {
        var buttonize, buttonset, enabled, format, widget, _ref;
        var _this = this;
        widget = this;
        buttonset = jQuery("<span class=\"" + widget.widgetName + "\"></span>");
        buttonize = function(format) {
          var button, element, id, label, queryState;
          label = format.substr(0, 1).toUpperCase();
          id = "" + _this.options.uuid + "-" + format;
          buttonset.append(jQuery("<input id=\"" + id + "\" type=\"checkbox\" /><label for=\"" + id + "\" class=\"" + format + "_button\">" + label + "</label>").button());
          button = jQuery("#" + id, buttonset);
          button.attr("hallo-command", format);
          button.addClass(format);
          button.bind("change", function(event) {
            format = jQuery(this).attr("hallo-command");
            return widget.options.editable.execute(format);
          });
          queryState = function(event) {
            if (document.queryCommandState(format)) {
              button.attr("checked", true);
              button.next("label").addClass("ui-state-clicked");
              return button.button("refresh");
            } else {
              button.attr("checked", false);
              button.next("label").removeClass("ui-state-clicked");
              return button.button("refresh");
            }
          };
          element = _this.element;
          _this.element.bind("halloenabled", function() {
            return element.bind("keyup paste change mouseup", queryState);
          });
          return _this.element.bind("hallodisabled", function() {
            return element.unbind("keyup paste change mouseup", queryState);
          });
        };
        _ref = this.options.formattings;
        for (format in _ref) {
          enabled = _ref[format];
          if (enabled) buttonize(format);
        }
        buttonset.buttonset();
        return this.options.toolbar.append(buttonset);
      },
      _init: function() {}
    });
  })(jQuery);
