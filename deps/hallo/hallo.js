
  (function(jQuery) {
    return jQuery.widget("IKS.hallo", {
      toolbar: null,
      bound: false,
      originalContent: "",
      uuid: "",
      selection: null,
      options: {
        editable: true,
        plugins: {},
        floating: true,
        offset: {
          x: 0,
          y: 0
        },
        showAlways: false,
        activated: function() {},
        deactivated: function() {},
        selected: function() {},
        unselected: function() {},
        enabled: function() {},
        disabled: function() {},
        placeholder: ''
      },
      _create: function() {
        var options, plugin, _ref, _results;
        this.originalContent = this.getContents();
        this.id = this._generateUUID();
        this._prepareToolbar();
        _ref = this.options.plugins;
        _results = [];
        for (plugin in _ref) {
          options = _ref[plugin];
          if (!jQuery.isPlainObject(options)) options = {};
          options["editable"] = this;
          options["toolbar"] = this.toolbar;
          options["uuid"] = this.id;
          _results.push(jQuery(this.element)[plugin](options));
        }
        return _results;
      },
      _init: function() {
        if (this.options.editable) {
          return this.enable();
        } else {
          return this.disable();
        }
      },
      disable: function() {
        this.element.attr("contentEditable", false);
        this.element.unbind("focus", this._activated);
        this.element.unbind("blur", this._deactivated);
        this.element.unbind("keyup paste change", this._checkModified);
        this.element.unbind("keyup", this._keys);
        this.element.unbind("keyup mouseup", this._checkSelection);
        this.bound = false;
        return this._trigger("disabled", null);
      },
      enable: function() {
        var widget;
        this.element.attr("contentEditable", true);
        if (!this.element.html()) this.element.html(this.options.placeholder);
        if (!this.bound) {
          this.element.bind("focus", this, this._activated);
          if (!this.options.showAlways) {
            this.element.bind("blur", this, this._deactivated);
          }
          this.element.bind("keyup paste change", this, this._checkModified);
          this.element.bind("keyup", this, this._keys);
          this.element.bind("keyup mouseup", this, this._checkSelection);
          widget = this;
          this.bound = true;
        }
        return this._trigger("enabled", null);
      },
      activate: function() {
        return this.element.focus();
      },
      getSelection: function() {
        var range, userSelection;
        if (jQuery.browser.msie) {
          range = document.selection.createRange();
        } else {
          if (window.getSelection) {
            userSelection = window.getSelection();
          } else if (document.selection) {
            userSelection = document.selection.createRange();
          } else {
            throw "Your browser does not support selection handling";
          }
          if (userSelection.rangeCount > 0) {
            range = userSelection.getRangeAt(0);
          } else {
            range = userSelection;
          }
        }
        return range;
      },
      restoreSelection: function(range) {
        if (jQuery.browser.msie) {
          return range.select();
        } else {
          window.getSelection().removeAllRanges();
          return window.getSelection().addRange(range);
        }
      },
      replaceSelection: function(cb) {
        var newTextNode, r, range, sel, t;
        if (jQuery.browser.msie) {
          t = document.selection.createRange().text;
          r = document.selection.createRange();
          return r.pasteHTML(cb(t));
        } else {
          sel = window.getSelection();
          range = sel.getRangeAt(0);
          newTextNode = document.createTextNode(cb(range.extractContents()));
          range.insertNode(newTextNode);
          range.setStartAfter(newTextNode);
          sel.removeAllRanges();
          return sel.addRange(range);
        }
      },
      removeAllSelections: function() {
        if (jQuery.browser.msie) {
          return range.empty();
        } else {
          return window.getSelection().removeAllRanges();
        }
      },
      getContents: function() {
        return this.element.html();
      },
      setContents: function(contents) {
        return this.element.html(contents);
      },
      isModified: function() {
        return this.originalContent !== this.getContents();
      },
      setUnmodified: function() {
        return this.originalContent = this.getContents();
      },
      restoreOriginalContent: function() {
        return this.element.html(this.originalContent);
      },
      execute: function(command, value) {
        if (document.execCommand(command, false, value)) {
          return this.element.trigger("change");
        }
      },
      _generateUUID: function() {
        var S4;
        S4 = function() {
          return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
        };
        return "" + (S4()) + (S4()) + "-" + (S4()) + "-" + (S4()) + "-" + (S4()) + "-" + (S4()) + (S4()) + (S4());
      },
      _getToolbarPosition: function(event, selection) {
        var offset;
        if (!event) return;
        if (this.options.floating) {
          if (event.originalEvent instanceof KeyboardEvent) {
            return this._getCaretPosition(selection);
          } else if (event.originalEvent instanceof MouseEvent) {
            return {
              top: event.pageY,
              left: event.pageX
            };
          }
        } else {
          offset = parseFloat(this.element.css('outline-width')) + parseFloat(this.element.css('outline-offset'));
          return {
            top: this.element.offset().top - this.toolbar.outerHeight() - offset,
            left: this.element.offset().left - offset
          };
        }
      },
      _getCaretPosition: function(range) {
        var newRange, position, tmpSpan;
        tmpSpan = jQuery("<span/>");
        newRange = document.createRange();
        newRange.setStart(range.endContainer, range.endOffset);
        newRange.insertNode(tmpSpan.get(0));
        position = {
          top: tmpSpan.offset().top,
          left: tmpSpan.offset().left
        };
        tmpSpan.remove();
        return position;
      },
      _prepareToolbar: function() {
        var that;
        that = this;
        this.toolbar = jQuery('<div class="hallotoolbar"></div>').hide();
        this.toolbar.css("position", "absolute");
        this.toolbar.css("top", this.element.offset().top - 20);
        this.toolbar.css("left", this.element.offset().left);
        jQuery('body').append(this.toolbar);
        this.toolbar.bind("mousedown", function(event) {
          return event.preventDefault();
        });
        if (this.options.showAlways) {
          this.options.floating = false;
          this.element.bind("halloactivated", function(event, data) {
            that._updateToolbarPosition(that._getToolbarPosition(event));
            return that.toolbar.show();
          });
          this.element.bind("hallodeactivated", function(event, data) {
            return that.toolbar.hide();
          });
        } else {
          this.element.bind("halloselected", function(event, data) {
            var position, widget;
            widget = data.editable;
            position = widget._getToolbarPosition(data.originalEvent, data.selection);
            if (position) {
              that._updateToolbarPosition(position);
              return that.toolbar.show();
            }
          });
          this.element.bind("hallounselected", function(event, data) {
            return data.editable.toolbar.hide();
          });
        }
        return jQuery(window).resize(function(event) {
          return that._updateToolbarPosition(that._getToolbarPosition(event));
        });
      },
      _updateToolbarPosition: function(position) {
        this.toolbar.css("top", position.top);
        return this.toolbar.css("left", position.left);
      },
      _checkModified: function(event) {
        var widget;
        widget = event.data;
        if (widget.isModified()) {
          return widget._trigger("modified", null, {
            editable: widget,
            content: widget.getContents()
          });
        }
      },
      _keys: function(event) {
        var widget;
        widget = event.data;
        if (event.keyCode === 27) {
          widget.restoreOriginalContent();
          return widget.turnOff();
        }
      },
      _rangesEqual: function(r1, r2) {
        return r1.startContainer === r2.startContainer && r1.startOffset === r2.startOffset && r1.endContainer === r2.endContainer && r1.endOffset === r2.endOffset;
      },
      _checkSelection: function(event) {
        var widget;
        if (event.keyCode === 27) return;
        widget = event.data;
        return setTimeout(function() {
          var sel;
          sel = widget.getSelection();
          if (widget._isEmptySelection(sel) || widget._isEmptyRange(sel)) {
            if (widget.selection) {
              widget.selection = null;
              widget._trigger("unselected", null, {
                editable: widget,
                originalEvent: event
              });
            }
            return;
          }
          if (!widget.selection || !widget._rangesEqual(sel, widget.selection)) {
            widget.selection = sel.cloneRange();
            return widget._trigger("selected", null, {
              editable: widget,
              selection: widget.selection,
              ranges: [widget.selection],
              originalEvent: event
            });
          }
        }, 0);
      },
      _isEmptySelection: function(selection) {
        if (selection.type === "Caret") return true;
        return false;
      },
      _isEmptyRange: function(range) {
        if (range.collapsed) return true;
        if (range.isCollapsed) return range.isCollapsed();
        return false;
      },
      turnOn: function() {
        var el, widthToAdd;
        if (this.getContents() === this.options.placeholder) this.setContents('');
        jQuery(this.element).addClass('inEditMode');
        if (!this.options.floating) {
          el = jQuery(this.element);
          widthToAdd = parseFloat(el.css('padding-left'));
          widthToAdd += parseFloat(el.css('padding-right'));
          widthToAdd += parseFloat(el.css('border-left-width'));
          widthToAdd += parseFloat(el.css('border-right-width'));
          widthToAdd += (parseFloat(el.css('outline-width'))) * 2;
          widthToAdd += (parseFloat(el.css('outline-offset'))) * 2;
          jQuery(this.toolbar).css("width", el.width() + widthToAdd);
        } else {
          this.toolbar.css("width", "auto");
        }
        return this._trigger("activated", this);
      },
      turnOff: function() {
        this.toolbar.hide();
        jQuery(this.element).removeClass('inEditMode');
        if (this.options.showAlways) this.element.blur();
        this._trigger("deactivated", this);
        if (!this.getContents()) return this.setContents(this.options.placeholder);
      },
      _activated: function(event) {
        return event.data.turnOn();
      },
      _deactivated: function(event) {
        return event.data.turnOff();
      }
    });
  })(jQuery);
