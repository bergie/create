
  (function(jQuery) {
    return jQuery.widget("IKS.hallolink", {
      options: {
        editable: null,
        toolbar: null,
        uuid: "",
        link: true,
        image: true,
        defaultUrl: 'http://',
        dialogOpts: {
          autoOpen: false,
          width: 540,
          height: 95,
          title: "Enter Link",
          modal: true,
          resizable: false,
          draggable: false,
          dialogClass: 'hallolink-dialog'
        }
      },
      _create: function() {
        var buttonize, buttonset, dialog, dialogId, dialogSubmitCb, urlInput, widget;
        var _this = this;
        widget = this;
        dialogId = "" + this.options.uuid + "-dialog";
        dialog = jQuery("<div id=\"" + dialogId + "\"><form action=\"#\" method=\"post\" class=\"linkForm\"><input class=\"url\" type=\"text\" name=\"url\" value=\"" + this.options.defaultUrl + "\" /><input type=\"submit\" id=\"addlinkButton\" value=\"Insert\" /></form></div>");
        urlInput = jQuery('input[name=url]', dialog).focus(function(e) {
          return this.select();
        });
        dialogSubmitCb = function() {
          var link;
          link = urlInput.val();
          widget.options.editable.restoreSelection(widget.lastSelection);
          if (((new RegExp(/^\s*$/)).test(link)) || link === widget.options.defaultUrl) {
            if (widget.lastSelection.collapsed) {
              widget.lastSelection.setStartBefore(widget.lastSelection.startContainer);
              widget.lastSelection.setEndAfter(widget.lastSelection.startContainer);
              window.getSelection().addRange(widget.lastSelection);
            }
            document.execCommand("unlink", null, "");
          } else {
            if (widget.lastSelection.startContainer.parentNode.href === void 0) {
              document.execCommand("createLink", null, link);
            } else {
              widget.lastSelection.startContainer.parentNode.href = link;
            }
          }
          widget.options.editable.element.trigger('change');
          widget.options.editable.removeAllSelections();
          dialog.dialog('close');
          return false;
        };
        dialog.find("form").submit(dialogSubmitCb);
        buttonset = jQuery("<span class=\"" + widget.widgetName + "\"></span>");
        buttonize = function(type) {
          var button, id;
          id = "" + _this.options.uuid + "-" + type;
          buttonset.append(jQuery("<input id=\"" + id + "\" type=\"checkbox\" /><label for=\"" + id + "\" class=\"anchor_button\" >" + type + "</label>").button());
          button = jQuery("#" + id, buttonset);
          button.bind("change", function(event) {
            widget.lastSelection = widget.options.editable.getSelection();
            urlInput = jQuery('input[name=url]', dialog);
            if (widget.lastSelection.startContainer.parentNode.href === void 0) {
              urlInput.val(widget.options.defaultUrl);
            } else {
              urlInput.val(jQuery(widget.lastSelection.startContainer.parentNode).attr('href'));
              jQuery(urlInput[0].form).find('input[type=submit]').val('update');
            }
            return dialog.dialog('open');
          });
          return _this.element.bind("keyup paste change mouseup", function(event) {
            var nodeName, start;
            start = jQuery(widget.options.editable.getSelection().startContainer);
            nodeName = start.prop('nodeName') ? start.prop('nodeName') : start.parent().prop('nodeName');
            if (nodeName && nodeName.toUpperCase() === "A") {
              button.attr("checked", true);
              button.next().addClass("ui-state-clicked");
              return button.button("refresh");
            } else {
              button.attr("checked", false);
              button.next().removeClass("ui-state-clicked");
              return button.button("refresh");
            }
          });
        };
        if (this.options.link) buttonize("A");
        if (this.options.link) {
          buttonset.buttonset();
          this.options.toolbar.append(buttonset);
          return dialog.dialog(this.options.dialogOpts);
        }
      },
      _init: function() {}
    });
  })(jQuery);
