
  (function(jQuery) {
    return jQuery.widget("Liip.halloimage", {
      options: {
        editable: null,
        toolbar: null,
        uuid: "",
        limit: 8,
        search: null,
        suggestions: null,
        loaded: null,
        upload: null,
        uploadUrl: null,
        dialogOpts: {
          autoOpen: false,
          width: 270,
          height: "auto",
          title: "Insert Images",
          modal: false,
          resizable: false,
          draggable: true,
          dialogClass: 'halloimage-dialog',
          close: function(ev, ui) {
            return jQuery('.image_button').removeClass('ui-state-clicked');
          }
        },
        dialog: null
      },
      _create: function() {
        var button, buttonset, dialogId, id, widget;
        widget = this;
        dialogId = "" + this.options.uuid + "-image-dialog";
        this.options.dialog = jQuery("<div id=\"" + dialogId + "\">                <div class=\"nav\">                    <ul class=\"tabs\">                    </ul>                    <div id=\"" + this.options.uuid + "-tab-activeIndicator\" class=\"tab-activeIndicator\" />                </div>                <div class=\"dialogcontent\">            </div>");
        if (widget.options.uploadUrl && !widget.options.upload) {
          widget.options.upload = widget._iframeUpload;
        }
        if (widget.options.suggestions) {
          this._addGuiTabSuggestions(jQuery(".tabs", this.options.dialog), jQuery(".dialogcontent", this.options.dialog));
        }
        if (widget.options.search) {
          this._addGuiTabSearch(jQuery(".tabs", this.options.dialog), jQuery(".dialogcontent", this.options.dialog));
        }
        if (widget.options.upload) {
          this._addGuiTabUpload(jQuery(".tabs", this.options.dialog), jQuery(".dialogcontent", this.options.dialog));
        }
        buttonset = jQuery("<span class=\"" + widget.widgetName + "\"></span>");
        id = "" + this.options.uuid + "-image";
        buttonset.append(jQuery("<input id=\"" + id + "\" type=\"checkbox\" /><label for=\"" + id + "\" class=\"image_button\" >Image</label>").button());
        button = jQuery("#" + id, buttonset);
        button.bind("change", function(event) {
          if (widget.options.dialog.dialog("isOpen")) {
            return widget._closeDialog();
          } else {
            return widget._openDialog();
          }
        });
        this.options.editable.element.bind("hallodeactivated", function(event) {
          return widget._closeDialog();
        });
        jQuery(this.options.editable.element).delegate("img", "click", function(event) {
          return widget._openDialog();
        });
        jQuery(this.options.dialog).find(".nav li").click(function() {
          jQuery("." + widget.widgetName + "-tab").each(function() {
            return jQuery(this).hide();
          });
          id = jQuery(this).attr("id");
          jQuery("#" + id + "-content").show();
          return jQuery("#" + widget.options.uuid + "-tab-activeIndicator").css("margin-left", jQuery(this).position().left + (jQuery(this).width() / 2));
        });
        jQuery("." + widget.widgetName + "-tab .imageThumbnail").live("click", function(event) {
          var scope;
          scope = jQuery(this).closest("." + widget.widgetName + "-tab");
          jQuery(".imageThumbnail", scope).removeClass("imageThumbnailActive");
          jQuery(this).addClass("imageThumbnailActive");
          jQuery(".activeImage", scope).attr("src", jQuery(this).attr("src"));
          return jQuery(".activeImageBg", scope).attr("src", jQuery(this).attr("src"));
        });
        buttonset.buttonset();
        this.options.toolbar.append(buttonset);
        this.options.dialog.dialog(this.options.dialogOpts);
        return this._addDragnDrop();
      },
      _init: function() {},
      _openDialog: function() {
        var articleTags, cleanUp, i, repoImagesFound, showResults, tagType, thumbId, tmpArticleTags, vie, widget, xposition, yposition;
        widget = this;
        cleanUp = function() {
          return window.setTimeout((function() {
            var thumbnails;
            thumbnails = jQuery(".imageThumbnail");
            return jQuery(thumbnails).each(function() {
              var size;
              size = jQuery("#" + this.id).width();
              if (size <= 20) return jQuery("#" + this.id).parent("li").remove();
            });
          }), 15000);
        };
        repoImagesFound = false;
        showResults = function(response) {
          jQuery.each(response.assets, function(key, val) {
            jQuery(".imageThumbnailContainer ul").append("<li><img src=\"" + val.url + "\" class=\"imageThumbnail\"></li>");
            return repoImagesFound = true;
          });
          if (response.assets.length > 0) return jQuery("#activitySpinner").hide();
        };
        jQuery('.image_button').addClass('ui-state-clicked');
        jQuery("#" + this.options.uuid + "-sugg-activeImage").attr("src", jQuery("#" + this.options.uuid + "-tab-suggestions-content .imageThumbnailActive").first().attr("src"));
        jQuery("#" + this.options.uuid + "-sugg-activeImageBg").attr("src", jQuery("#" + this.options.uuid + "-tab-suggestions-content .imageThumbnailActive").first().attr("src"));
        this.lastSelection = this.options.editable.getSelection();
        xposition = jQuery(this.options.editable.element).offset().left + jQuery(this.options.editable.element).outerWidth() - 3;
        yposition = jQuery(this.options.toolbar).offset().top - jQuery(document).scrollTop() - 29;
        this.options.dialog.dialog("option", "position", [xposition, yposition]);
        if (widget.options.loaded === null && widget.options.suggestions) {
          articleTags = [];
          jQuery("#activitySpinner").show();
          tmpArticleTags = jQuery(".inEditMode").parent().find(".articleTags input").val();
          tmpArticleTags = tmpArticleTags.split(",");
          for (i in tmpArticleTags) {
            tagType = typeof tmpArticleTags[i];
            if ("string" === tagType && tmpArticleTags[i].indexOf("http") !== -1) {
              articleTags.push(tmpArticleTags[i]);
            }
          }
          jQuery(".imageThumbnailContainer ul").empty();
          widget.options.suggestions(jQuery(".inEditMode").parent().find(".articleTags input").val(), widget.options.limit, 0, showResults);
          vie = new VIE();
          vie.use(new vie.DBPediaService({
            url: "http://dev.iks-project.eu/stanbolfull",
            proxyDisabled: true
          }));
          thumbId = 1;
          if (articleTags.length === 0) {
            jQuery("#activitySpinner").html("No images found.");
          }
          jQuery(articleTags).each(function() {
            return vie.load({
              entity: this + ""
            }).using("dbpedia").execute().done(function(entity) {
              jQuery(entity).each(function() {
                var img, responseType;
                if (this.attributes["<http://dbpedia.org/ontology/thumbnail>"]) {
                  responseType = typeof this.attributes["<http://dbpedia.org/ontology/thumbnail>"];
                  if (responseType === "string") {
                    img = this.attributes["<http://dbpedia.org/ontology/thumbnail>"];
                    img = img.substring(1, img.length - 1);
                  }
                  if (responseType === "object") {
                    img = "";
                    img = this.attributes["<http://dbpedia.org/ontology/thumbnail>"][0].value;
                  }
                  jQuery(".imageThumbnailContainer ul").append("<li><img id=\"si-" + thumbId + "\" src=\"" + img + "\" class=\"imageThumbnail\"></li>");
                  return thumbId++;
                }
              });
              return jQuery("#activitySpinner").hide();
            });
          });
        }
        cleanUp();
        widget.options.loaded = 1;
        return this.options.dialog.dialog("open");
      },
      _closeDialog: function() {
        return this.options.dialog.dialog("close");
      },
      _addGuiTabSuggestions: function(tabs, element) {
        var widget;
        widget = this;
        tabs.append(jQuery("<li id=\"" + this.options.uuid + "-tab-suggestions\" class=\"" + widget.widgetName + "-tabselector " + widget.widgetName + "-tab-suggestions\"><span>Suggestions</span></li>"));
        return element.append(jQuery("<div id=\"" + this.options.uuid + "-tab-suggestions-content\" class=\"" + widget.widgetName + "-tab tab-suggestions\">                <div class=\"imageThumbnailContainer fixed\"><div id=\"activitySpinner\">Loading Images...</div><ul><li>                    <img src=\"http://imagesus.homeaway.com/mda01/badf2e69babf2f6a0e4b680fc373c041c705b891\" class=\"imageThumbnail imageThumbnailActive\" />                  </li></ul><br style=\"clear:both\"/>                </div>                <div class=\"activeImageContainer\">                    <div class=\"rotationWrapper\">                        <div class=\"hintArrow\"></div>                        <img src=\"\" id=\"" + this.options.uuid + "-sugg-activeImage\" class=\"activeImage\" />                    </div>                    <img src=\"\" id=\"" + this.options.uuid + "-sugg-activeImageBg\" class=\"activeImage activeImageBg\" />                </div>                <div class=\"metadata\">                    <label for=\"caption-sugg\">Caption</label><input type=\"text\" id=\"caption-sugg\" />                </div>            </div>"));
      },
      _addGuiTabSearch: function(tabs, element) {
        var dialogId, widget;
        widget = this;
        dialogId = "" + this.options.uuid + "-image-dialog";
        tabs.append(jQuery("<li id=\"" + this.options.uuid + "-tab-search\" class=\"" + widget.widgetName + "-tabselector " + widget.widgetName + "-tab-search\"><span>Search</span></li>"));
        element.append(jQuery("<div id=\"" + this.options.uuid + "-tab-search-content\" class=\"" + widget.widgetName + "-tab tab-search\">                <form type=\"get\" id=\"" + this.options.uuid + "-" + widget.widgetName + "-searchForm\">                    <input type=\"text\" class=\"searchInput\" /><input type=\"submit\" id=\"" + this.options.uuid + "-" + widget.widgetName + "-searchButton\" class=\"button searchButton\" value=\"OK\"/>                </form>                <div class=\"searchResults imageThumbnailContainer\"></div>                <div id=\"" + this.options.uuid + "-search-activeImageContainer\" class=\"search-activeImageContainer activeImageContainer\">                    <div class=\"rotationWrapper\">                        <div class=\"hintArrow\"></div>                        <img src=\"\" id=\"" + this.options.uuid + "-search-activeImageBg\" class=\"activeImage\" />                    </div>                    <img src=\"\" id=\"" + this.options.uuid + "-search-activeImage\" class=\"activeImage activeImageBg\" />                </div>                <div class=\"metadata\" id=\"metadata-search\" style=\"display: none;\">                    <label for=\"caption-search\">Caption</label><input type=\"text\" id=\"caption-search\" />                    <!--<button id=\"" + this.options.uuid + "-" + widget.widgetName + "-addimage\">Add Image</button>-->                </div>            </div>"));
        return jQuery(".tab-search form", element).submit(function(event) {
          var showResults, that;
          event.preventDefault();
          that = this;
          showResults = function(response) {
            var container, firstimage, items;
            items = [];
            items.push("<div class=\"pager-prev\" style=\"display:none\"></div>");
            jQuery.each(response.assets, function(key, val) {
              return items.push("<img src=\"" + val.url + "\" class=\"imageThumbnail " + widget.widgetName + "-search-imageThumbnail\" /> ");
            });
            items.push("<div class=\"pager-next\" style=\"display:none\"></div>");
            container = jQuery("#" + dialogId + " .tab-search .searchResults");
            container.html(items.join(""));
            if (response.offset > 0) jQuery('.pager-prev', container).show();
            if (response.offset < response.total) {
              jQuery('.pager-next', container).show();
            }
            jQuery('.pager-prev', container).click(function(event) {
              return widget.options.search(null, widget.options.limit, response.offset - widget.options.limit, showResults);
            });
            jQuery('.pager-next', container).click(function(event) {
              return widget.options.search(null, widget.options.limit, response.offset + widget.options.limit, showResults);
            });
            jQuery("#" + widget.options.uuid + "-search-activeImageContainer").show();
            firstimage = jQuery("." + widget.widgetName + "-search-imageThumbnail").first().addClass("imageThumbnailActive");
            jQuery("#" + widget.options.uuid + "-search-activeImage, #" + widget.options.uuid + "-search-activeImageBg").attr("src", firstimage.attr("src"));
            return jQuery("#metadata-search").show();
          };
          return widget.options.search(null, widget.options.limit, 0, showResults);
        });
      },
      _prepareIframe: function(widget) {
        var iframe;
        widget.options.iframeName = "" + widget.options.uuid + "-" + widget.widgetName + "-postframe";
        iframe = jQuery("<iframe name=\"" + widget.options.iframeName + "\" id=\"" + widget.options.iframeName + "\" class=\"hidden\" src=\"javascript:false;\" style=\"display:none\" />");
        jQuery("#" + widget.options.uuid + "-" + widget.widgetName + "-iframe").append(iframe);
        return iframe.get(0).name = widget.options.iframeName;
      },
      _iframeUpload: function(data) {
        var uploadForm, widget;
        widget = data.widget;
        widget._prepareIframe(widget);
        jQuery("#" + widget.options.uuid + "-" + widget.widgetName + "-tags").val(jQuery(".inEditMode").parent().find(".articleTags input").val());
        uploadForm = jQuery("#" + widget.options.uuid + "-" + widget.widgetName + "-uploadform");
        uploadForm.attr("action", widget.options.uploadUrl);
        uploadForm.attr("method", "post");
        uploadForm.attr("userfile", data.file);
        uploadForm.attr("enctype", "multipart/form-data");
        uploadForm.attr("encoding", "multipart/form-data");
        uploadForm.attr("target", widget.options.iframeName);
        uploadForm.submit();
        return jQuery("#" + widget.options.iframeName).load(function() {
          return data.success(jQuery("#" + widget.options.iframeName)[0].contentWindow.location.href);
        });
      },
      _addGuiTabUpload: function(tabs, element) {
        var iframe, insertImage, widget;
        widget = this;
        tabs.append(jQuery("<li id=\"" + this.options.uuid + "-tab-upload\" class=\"" + widget.widgetName + "-tabselector " + widget.widgetName + "-tab-upload\"><span>Upload</span></li>"));
        element.append(jQuery("<div id=\"" + this.options.uuid + "-tab-upload-content\" class=\"" + widget.widgetName + "-tab tab-upload\">                <form id=\"" + this.options.uuid + "-" + widget.widgetName + "-uploadform\">                    <input id=\"" + this.options.uuid + "-" + widget.widgetName + "-file\" name=\"" + this.options.uuid + "-" + widget.widgetName + "-file\" type=\"file\" class=\"file\">                    <input id=\"" + this.options.uuid + "-" + widget.widgetName + "-tags\" name=\"tags\" type=\"hidden\" />                    <br />                    <input type=\"submit\" value=\"Upload\" id=\"" + this.options.uuid + "-" + widget.widgetName + "-upload\">                </form>                <div id=\"" + this.options.uuid + "-" + widget.widgetName + "-iframe\"></div>            </div>"));
        iframe = jQuery("<iframe name=\"postframe\" id=\"postframe\" class=\"hidden\" src=\"about:none\" style=\"display:none\" />");
        jQuery("#" + widget.options.uuid + "-" + widget.widgetName + "-upload").live("click", function(e) {
          var userFile;
          e.preventDefault();
          userFile = jQuery("#" + widget.options.uuid + "-" + widget.widgetName + "-file").val();
          widget.options.upload({
            widget: widget,
            file: userFile,
            success: function(imageUrl) {
              var imageID, list;
              imageID = "si" + Math.floor(Math.random() * (400 - 300 + 1) + 400) + "ab";
              if (jQuery(".imageThumbnailContainer ul", widget.options.dialog).length === 0) {
                list = jQuery('<ul></ul>');
                jQuery('.imageThumbnailContainer').append(list);
              }
              jQuery(".imageThumbnailContainer ul", widget.options.dialog).append("<li><img src=\"" + imageUrl + "\" id=\"" + imageID + "\" class=\"imageThumbnail\"></li>");
              jQuery("#" + imageID).trigger("click");
              return jQuery(widget.options.dialog).find(".nav li").first().trigger("click");
            }
          });
          return false;
        });
        insertImage = function() {
          var img, triggerModified;
          try {
            if (!widget.options.editable.getSelection()) {
              throw new Error("SelectionNotSet");
            }
          } catch (error) {
            widget.options.editable.restoreSelection(widget.lastSelection);
          }
          document.execCommand("insertImage", null, jQuery(this).attr('src'));
          img = document.getSelection().anchorNode.firstChild;
          jQuery(img).attr("alt", jQuery(".caption").value);
          triggerModified = function() {
            return widget.element.trigger("hallomodified");
          };
          window.setTimeout(triggerModified, 100);
          return widget._closeDialog();
        };
        return this.options.dialog.find(".halloimage-activeImage, #" + widget.options.uuid + "-" + widget.widgetName + "-addimage").click(insertImage);
      },
      _addDragnDrop: function() {
        var dnd, draggables, editable, helper, offset, overlay, overlayMiddleConfig, third, widgetOptions;
        helper = {
          delayAction: function(functionToCall, delay) {
            var timer;
            timer = clearTimeout(timer);
            if (!timer) return timer = setTimeout(functionToCall, delay);
          },
          calcPosition: function(offset, event) {
            var position;
            position = offset.left + third;
            if (event.pageX >= position && event.pageX <= (offset.left + third * 2)) {
              return "middle";
            } else if (event.pageX < position) {
              return "left";
            } else if (event.pageX > (offset.left + third * 2)) {
              return "right";
            }
          },
          createInsertElement: function(image, tmp) {
            var altText, height, imageInsert, maxHeight, maxWidth, ratio, tmpImg, width;
            maxWidth = 250;
            maxHeight = 250;
            tmpImg = new Image();
            tmpImg.src = image.src;
            if (!tmp) {
              if (this.startPlace.parents(".tab-suggestions").length > 0) {
                altText = jQuery("#caption-sugg").val();
              } else if (this.startPlace.parents(".tab-search").length > 0) {
                altText = jQuery("#caption-search").val();
              } else {
                altText = jQuery(image).attr("alt");
              }
            }
            width = tmpImg.width;
            height = tmpImg.height;
            if (width > maxWidth || height > maxHeight) {
              if (width > height) {
                ratio = (tmpImg.width / maxWidth).toFixed();
              } else {
                ratio = (tmpImg.height / maxHeight).toFixed();
              }
              width = (tmpImg.width / ratio).toFixed();
              height = (tmpImg.height / ratio).toFixed();
            }
            imageInsert = jQuery("<img>").attr({
              src: tmpImg.src,
              width: width,
              height: height,
              alt: altText,
              "class": (tmp ? "tmp" : "")
            }).show();
            return imageInsert;
          },
          createLineFeedbackElement: function() {
            return jQuery("<div/>").addClass("tmpLine");
          },
          removeFeedbackElements: function() {
            return jQuery('.tmp, .tmpLine', editable).remove();
          },
          removeCustomHelper: function() {
            return jQuery(".customHelper").remove();
          },
          showOverlay: function(position) {
            var eHeight;
            eHeight = editable.height() + parseFloat(editable.css('paddingTop')) + parseFloat(editable.css('paddingBottom'));
            overlay.big.css({
              height: eHeight
            });
            overlay.left.css({
              height: eHeight
            });
            overlay.right.css({
              height: eHeight
            });
            switch (position) {
              case "left":
                overlay.big.addClass("bigOverlayLeft").removeClass("bigOverlayRight").css({
                  left: third
                }).show();
                overlay.left.hide();
                return overlay.right.hide();
              case "middle":
                overlay.big.removeClass("bigOverlayLeft bigOverlayRight");
                overlay.big.hide();
                overlay.left.show();
                return overlay.right.show();
              case "right":
                overlay.big.addClass("bigOverlayRight").removeClass("bigOverlayLeft").css({
                  left: 0
                }).show();
                overlay.left.hide();
                return overlay.right.hide();
            }
          },
          checkOrigin: function(event) {
            if (jQuery(event.target).parents("[contenteditable]").length !== 0) {
              return true;
            } else {
              return false;
            }
          },
          startPlace: ""
        };
        dnd = {
          createTmpFeedback: function(image, position) {
            var el;
            if (position === 'middle') {
              return helper.createLineFeedbackElement();
            } else {
              el = helper.createInsertElement(image, true);
              return el.addClass("inlineImage-" + position);
            }
          },
          handleOverEvent: function(event, ui) {
            var postPone;
            postPone = function() {
              var position;
              window.waitWithTrash = clearTimeout(window.waitWithTrash);
              position = helper.calcPosition(offset, event);
              jQuery('.trashcan', ui.helper).remove();
              editable.append(overlay.big);
              editable.append(overlay.left);
              editable.append(overlay.right);
              helper.removeFeedbackElements();
              jQuery(event.target).prepend(dnd.createTmpFeedback(ui.draggable[0], position));
              if (position === "middle") {
                jQuery(event.target).prepend(dnd.createTmpFeedback(ui.draggable[0], 'right'));
                jQuery('.tmp', jQuery(event.target)).hide();
              } else {
                jQuery(event.target).prepend(dnd.createTmpFeedback(ui.draggable[0], 'middle'));
                jQuery('.tmpLine', jQuery(event.target)).hide();
              }
              return helper.showOverlay(position);
            };
            return setTimeout(postPone, 5);
          },
          handleDragEvent: function(event, ui) {
            var position, tmpFeedbackLR, tmpFeedbackMiddle;
            position = helper.calcPosition(offset, event);
            if (position === dnd.lastPositionDrag) return;
            dnd.lastPositionDrag = position;
            tmpFeedbackLR = jQuery('.tmp', editable);
            tmpFeedbackMiddle = jQuery('.tmpLine', editable);
            if (position === "middle") {
              tmpFeedbackMiddle.show();
              tmpFeedbackLR.hide();
            } else {
              tmpFeedbackMiddle.hide();
              tmpFeedbackLR.removeClass("inlineImage-left inlineImage-right").addClass("inlineImage-" + position).show();
            }
            return helper.showOverlay(position);
          },
          handleLeaveEvent: function(event, ui) {
            var func;
            func = function() {
              if (!jQuery('div.trashcan', ui.helper).length) {
                jQuery(ui.helper).append(jQuery('<div class="trashcan"></div>'));
              }
              return jQuery('.bigOverlay, .smallOverlay').remove();
            };
            window.waitWithTrash = setTimeout(func, 200);
            return helper.removeFeedbackElements();
          },
          handleStartEvent: function(event, ui) {
            var internalDrop;
            internalDrop = helper.checkOrigin(event);
            if (internalDrop) jQuery(event.target).remove();
            jQuery(document).trigger('startPreventSave');
            return helper.startPlace = jQuery(event.target);
          },
          handleStopEvent: function(event, ui) {
            var internalDrop;
            internalDrop = helper.checkOrigin(event);
            if (internalDrop) {
              jQuery(event.target).remove();
            } else {
              editable.trigger('change');
            }
            overlay.big.hide();
            overlay.left.hide();
            overlay.right.hide();
            return jQuery(document).trigger('stopPreventSave');
          },
          handleDropEvent: function(event, ui) {
            var imageInsert, internalDrop, position;
            internalDrop = helper.checkOrigin(event);
            position = helper.calcPosition(offset, event);
            helper.removeFeedbackElements();
            helper.removeCustomHelper();
            imageInsert = helper.createInsertElement(ui.draggable[0], false);
            if (position === "middle") {
              imageInsert.show();
              imageInsert.removeClass("inlineImage-middle inlineImage-left inlineImage-right").addClass("inlineImage-" + position).css({
                position: "relative",
                left: ((editable.width() + parseFloat(editable.css('paddingLeft')) + parseFloat(editable.css('paddingRight'))) - imageInsert.attr('width')) / 2
              });
              imageInsert.insertBefore(jQuery(event.target));
            } else {
              imageInsert.removeClass("inlineImage-middle inlineImage-left inlineImage-right").addClass("inlineImage-" + position).css("display", "block");
              jQuery(event.target).prepend(imageInsert);
            }
            overlay.big.hide();
            overlay.left.hide();
            overlay.right.hide();
            editable.trigger('change');
            return dnd.init(editable);
          },
          createHelper: function(event) {
            return jQuery('<div>').css({
              backgroundImage: "url(" + jQuery(event.currentTarget).attr('src') + ")"
            }).addClass('customHelper').appendTo('body');
          },
          init: function() {
            var draggable, initDraggable;
            draggable = [];
            initDraggable = function(elem) {
              if (!elem.jquery_draggable_initialized) {
                elem.jquery_draggable_initialized = true;
                jQuery(elem).draggable({
                  cursor: "move",
                  helper: dnd.createHelper,
                  drag: dnd.handleDragEvent,
                  start: dnd.handleStartEvent,
                  stop: dnd.handleStopEvent,
                  disabled: !editable.hasClass('inEditMode'),
                  cursorAt: {
                    top: 50,
                    left: 50
                  }
                });
              }
              return draggables.push(elem);
            };
            jQuery(".rotationWrapper img", widgetOptions.dialog).each(function(index, elem) {
              if (!elem.jquery_draggable_initialized) return initDraggable(elem);
            });
            jQuery("img", editable).each(function(index, elem) {
              elem.contentEditable = false;
              if (!elem.jquery_draggable_initialized) return initDraggable(elem);
            });
            return jQuery("p", editable).each(function(index, elem) {
              if (!elem.jquery_droppable_initialized) {
                elem.jquery_droppable_initialized = true;
                return jQuery('p', editable).droppable({
                  tolerance: "pointer",
                  drop: dnd.handleDropEvent,
                  over: dnd.handleOverEvent,
                  out: dnd.handleLeaveEvent
                });
              }
            });
          },
          enableDragging: function() {
            return jQuery.each(draggables, function(index, d) {
              return jQuery(d).draggable('option', 'disabled', false);
            });
          },
          disableDragging: function() {
            return jQuery.each(draggables, function(index, d) {
              return jQuery(d).draggable('option', 'disabled', true);
            });
          }
        };
        draggables = [];
        editable = jQuery(this.options.editable.element);
        widgetOptions = this.options;
        offset = editable.offset();
        third = parseFloat(editable.width() / 3);
        overlayMiddleConfig = {
          width: third,
          height: editable.height()
        };
        overlay = {
          big: jQuery("<div/>").addClass("bigOverlay").css({
            width: third * 2,
            height: editable.height()
          }),
          left: jQuery("<div/>").addClass("smallOverlay smallOverlayLeft").css(overlayMiddleConfig),
          right: jQuery("<div/>").addClass("smallOverlay smallOverlayRight").css(overlayMiddleConfig).css("left", third * 2)
        };
        dnd.init();
        editable.bind('halloactivated', dnd.enableDragging);
        return editable.bind('hallodeactivated', dnd.disableDragging);
      }
    });
  })(jQuery);
