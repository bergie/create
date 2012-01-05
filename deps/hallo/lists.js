
  (function(jQuery) {
    return jQuery.widget("IKS.hallolists", {
      options: {
        editable: null,
        toolbar: null,
        uuid: "",
        lists: {
          ordered: true,
          unordered: true
        }
      },
      _create: function() {
        var buttonize, buttonset, widget;
        var _this = this;
        widget = this;
        buttonset = jQuery("<span class=\"" + widget.widgetName + "\"></span>");
        buttonize = function(type, label) {
          var button, element, id, queryState;
          id = "" + _this.options.uuid + "-" + type;
          buttonset.append(jQuery("<input id=\"" + id + "\" type=\"checkbox\" /><label for=\"" + id + "\" class=\"" + type + "_button\">" + label + "</label>").button());
          button = jQuery("#" + id, buttonset);
          button.attr("hallo-command", "insert" + type + "List");
          button.bind("change", function(event) {
            var list;
            list = jQuery(this).attr("hallo-command");
            return widget.options.editable.execute(list);
          });
          queryState = function(event) {
            if (document.queryCommandState("insert" + type + "List")) {
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
        if (this.options.lists.ordered) buttonize("Ordered", "OL");
        if (this.options.lists.unordered) buttonize("Unordered", "UL");
        buttonset.buttonset();
        return this.options.toolbar.append(buttonset);
      },
      _init: function() {}
    });
  })(jQuery);
