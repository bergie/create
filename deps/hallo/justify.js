
  (function(jQuery) {
    return jQuery.widget("IKS.hallojustify", {
      options: {
        editable: null,
        toolbar: null,
        uuid: ""
      },
      _create: function() {
        var buttonize, buttonset, widget;
        var _this = this;
        widget = this;
        buttonset = jQuery("<span class=\"" + widget.widgetName + "\"></span>");
        buttonize = function(alignment) {
          var button, element, id, queryState;
          id = "" + _this.options.uuid + "-" + alignment;
          buttonset.append(jQuery("<input id=\"" + id + "\" type=\"checkbox\" /><label for=\"" + id + "\" class=\"" + alignment + "_button\" >" + alignment + "</label>").button());
          button = jQuery("#" + id, buttonset);
          button.attr("hallo-command", "justify" + alignment);
          button.bind("change", function(event) {
            var justify;
            justify = jQuery(this).attr("hallo-command");
            return widget.options.editable.execute(justify);
          });
          queryState = function(event) {
            if (document.queryCommandState("justify" + alignment)) {
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
          element.bind("halloenabled", function() {
            return element.bind("keyup paste change mouseup", queryState);
          });
          return element.bind("hallodisabled", function() {
            return element.unbind("keyup paste change mouseup", queryState);
          });
        };
        buttonize("Left");
        buttonize("Center");
        buttonize("Right");
        buttonset.buttonset();
        return this.options.toolbar.append(buttonset);
      },
      _init: function() {}
    });
  })(jQuery);
