/*
//     Create.js - On-site web editing interface
//     (c) 2012 Jerry Jalava, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
*/
(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false Backbone:false document:false */
  'use strict';

  var _midgardnotifications_active = [];
  var MidgardNotification = function (parent, options) {
      var _defaults = {
        class_prefix: 'midgardNotifications',
        timeout: 3000,
        // Set to 0 for sticky
        auto_show: true,
        body: '',
        bindTo: null,
        gravity: 'T',
        effects: {
          onShow: function (item, cb) {
            item.animate({
              opacity: 'show'
            }, 600, cb);
          },
          onHide: function (item, cb) {
            item.animate({
              opacity: 'hide'
            }, 600, cb);
          }
        },
        actions: [],
        callbacks: {}
      };
      var _config = {};
      var _classes = {};
      var _item = null;
      var _id = null;
      var _bind_target = null;

      var _parent = parent;

      var _story = null;

      var base = {
        constructor: function (options) {
          _config = _.extend(_defaults, options || {});

          _classes = {
            container: _config.class_prefix + '-container',
            item: {
              wrapper: _config.class_prefix + '-item',
              arrow: _config.class_prefix + '-arrow',
              disregard: _config.class_prefix + '-disregard',
              content: _config.class_prefix + '-content',
              actions: _config.class_prefix + '-actions',
              action: _config.class_prefix + '-action'
            }
          };

          this._generate();
        },
        getId: function () {
          return _id;
        },
        getElement: function () {
          return _item;
        },
        _generate: function () {
          var _self = this;
          var outer, inner, content = null;

          _item = outer = jQuery('<div class="' + _classes.item.wrapper + '-outer"/>');
          outer.css({
            display: 'none'
          });
          inner = jQuery('<div class="' + _classes.item.wrapper + '-inner"/>');
          inner.appendTo(outer);

          if (_config.bindTo) {
            outer.addClass(_classes.item.wrapper + '-binded');

            var arrow = jQuery('<div class="' + _classes.item.arrow + '"/>');
            arrow.appendTo(outer);
          } else {
            outer.addClass(_classes.item.wrapper + '-normal');
          }

          content = jQuery('<div class="' + _classes.item.content + '"/>');
          content.html(_config.body);
          content.appendTo(inner);

          if (_config.actions.length) {
            var actions_holder = jQuery('<div class="' + _classes.item.actions + '"/>');
            actions_holder.appendTo(inner);
            jQuery.each(_config.actions, function (i, opts) {
              var action = jQuery('<button name="' + opts.name + '" class="button-' + opts.name + '">' + opts.label + '</button>').button();
              action.on('click', function (e) {
                if (_story) {
                  opts.cb(e, _story, _self);
                } else {
                  opts.cb(e, _self);
                }

              });
              if (opts.className) {
                action.addClass(opts.className);
              }
              actions_holder.append(action);
            });
          }

          _item.on('click', function (e) {
            if (_config.callbacks.onClick) {
              _config.callbacks.onClick(e, _self);
            } else {
              if (!_story) {
                _self.close();
              }
            }
          });

          if (_config.auto_show) {
            this.show();
          }

          this._setPosition();

          _id = _midgardnotifications_active.push(this);

          _parent.append(_item);
        },
        
       _calculatePositionForGravity: function (item, gravity, target, itemDimensions) {
          item.find('.' + _classes.item.arrow).addClass(_classes.item.arrow + '_' + gravity);
          switch (gravity) {
          case 'TL':
            return {
              left: target.left,
              top: target.top + target.height + 'px'
            };
          case 'TR':
            return {
              left: target.left + target.width - itemDimensions.width + 'px',
              top: target.top + target.height + 'px'
            };
          case 'BL':
            return {
              left: target.left + 'px',
              top: target.top - itemDimensions.height + 'px'
            };
          case 'BR':
            return {
              left: target.left + target.width - itemDimensions.width + 'px',
              top: target.top - itemDimensions.height + 'px'
            };
          case 'LT':
            return {
              left: target.left + target.width + 'px',
              top: target.top + 'px'
            };
          case 'LB':
            return {
              left: target.left + target.width + 'px',
              top: target.top + target.height - itemDimensions.height + 'px'
            };
          case 'RT':
            return {
              left: target.left - itemDimensions.width + 'px',
              top: target.top + 'px'
            };
          case 'RB':
            return {
              left: target.left - itemDimensions.width + 'px',
              top: target.top + target.height - itemDimensions.height + 'px'
            };
          case 'T':
            return {
              left: target.left + target.width / 2 - itemDimensions.width / 2 + 'px',
              top: target.top + target.height + 'px'
            };
          case 'R':
            return {
              left: target.left - itemDimensions.width + 'px',
              top: target.top + target.height / 2 - itemDimensions.height / 2 + 'px'
            };
          case 'B':
            return {
              left: target.left + target.width / 2 - itemDimensions.width / 2 + 'px',
              top: target.top - itemDimensions.height + 'px'
            };
          case 'L':
            return {
              left: target.left + target.width + 'px',
              top: target.top + target.height / 2 - itemDimensions.height / 2 + 'px'
            };
          }
        },
        
        _isFixed: function (element) {
          if (element === document) {
            return false;
          }
          if (element.css('position') === 'fixed') {
            return true;
          }
          var parentElement = element.offsetParent();
          if (parentElement.get(0) === element.get(0)) {
            return false;
          }
          return this._isFixed(parentElement);
        },

        _setPosition: function () {
          var pos;
          if (_config.bindTo) {
            var itemDimensions = {
              width: _item.width() ? _item.width() : 280,
              height: _item.height() ? _item.height() : 109
            };
            
            _bind_target = jQuery(_config.bindTo);
            var properties = {};
            
            var targetDimensions = {
              width: _bind_target.outerWidth(),
              height: _bind_target.outerHeight()
            };
            
            if (this._isFixed(_bind_target)) {
              properties.position = 'fixed';
              targetDimensions.left = _bind_target.offset().left;
              targetDimensions.top = _bind_target.position().top;
            } else {
              properties.position = 'absolute';
              targetDimensions.left = _bind_target.offset().left;
              targetDimensions.top = _bind_target.offset().top;
            }
            
            pos = this._calculatePositionForGravity(_item, _config.gravity, targetDimensions, itemDimensions);
            properties.top = pos.top;
            properties.left = pos.left;

            _item.css(properties);

            return;
          }

          if (!_config.position) {
            _config.position = 'top right';
          }

          var marginTop = jQuery('.create-ui-toolbar-wrapper').outerHeight(true) + 6;
          pos = {
            position: 'fixed'
          };

          var item;
          var activeHeight = function (items) {
            var total_height = 0;
            jQuery.each(items, function (i, item) {
              if (!item) {
                return;
              }
              total_height += item.getElement().height();
            });
            return total_height;
          };

          if (_config.position.match(/top/)) {
            pos.top = marginTop + activeHeight(_midgardnotifications_active) + 'px';
          }
          if (_config.position.match(/bottom/)) {
            pos.bottom = (_midgardnotifications_active.length - 1 * item.height()) + item.height() + 10 + 'px';
          }
          if (_config.position.match(/right/)) {
            pos.right = 20 + 'px';
          }
          if (_config.position.match(/left/)) {
            pos.left = 20 + 'px';
          }

          _item.css(pos);
        },
        show: function () {
          var self = this;
          var w_t, w_b, b_b, b_t, e_t, e_h;

          if (_config.callbacks.beforeShow) {
            _config.callbacks.beforeShow(self);
          }

          if (_config.bindTo) {
            var _bind_target = jQuery(_config.bindTo);
            w_t = jQuery(window).scrollTop();
            w_b = jQuery(window).scrollTop() + jQuery(window).height();
            b_t = parseFloat(_item.offset().top, 10);
            e_t = _bind_target.offset().top;
            e_h = _bind_target.outerHeight();

            if (e_t < b_t) {
              b_t = e_t;
            }

            b_b = parseFloat(_item.offset().top, 10) + _item.height();
            if ((e_t + e_h) > b_b) {
              b_b = e_t + e_h;
            }
          }

          if (_config.timeout > 0 && !_config.actions.length) {
            window.setTimeout(function () {
              self.close();
            }, _config.timeout);
          }

          if (_config.bindTo && (b_t < w_t || b_t > w_b) || (b_b < w_t || b_b > w_b)) {
            jQuery('html, body').stop().animate({
              scrollTop: b_t
            }, 500, 'easeInOutExpo', function () {
              _config.effects.onShow(_item, function () {
                if (_config.callbacks.afterShow) {
                  _config.callbacks.afterShow(self);
                }
              });
            });
          } else {
            _config.effects.onShow(_item, function () {
              if (_config.callbacks.afterShow) {
                _config.callbacks.afterShow(self);
              }
            });
          }
        },
        close: function () {
          var self = this;
          if (_config.callbacks.beforeClose) {
            _config.callbacks.beforeClose(self);
          }
          _config.effects.onHide(_item, function () {
            if (_config.callbacks.afterClose) {
              _config.callbacks.afterClose(self);
            }
            self.destroy();
          });
        },
        destroy: function () {
          var self = this;
          jQuery.each(_midgardnotifications_active, function (i, item) {
            if (item) {
              if (item.getId() == self.getId()) {
                delete _midgardnotifications_active[i];
              }
            }
          });
          jQuery(_item).remove();
        },
        setStory: function (story) {
          _story = story;
        },
        setName: function (name) {
          _item.addClass(_classes.item.wrapper + '-custom-' + name);
          this.name = name;
        }
      };
      base.constructor(options);
      delete base.constructor;

      return base;
    };

  var MidgardNotificationStoryline = function (options, items) {
      var _defaults = {};
      var _config = {};
      var _storyline = {};
      var _current_notification = {};
      var _previous_item_name = null;
      var _first_item_name = null;
      var _last_item_name = null;
      var _current_item = null;

      var base = {
        constructor: function (options) {
          _config = _.extend(_defaults, options || {});
        },
        setStoryline: function (items) {
          var default_structure = {
            content: '',
            actions: [],
            show_actions: true,
            notification: {},
            // Notification options to override
            back: null,
            back_label: null,
            forward: null,
            forward_label: null,
            beforeShow: null,
            afterShow: null,
            beforeClose: null,
            afterClose: null
          };

          _storyline = {};
          _current_item = null;
          _previous_item_name = null;
          _first_item_name = null;
          _last_item_name = null;

          var self = this;

          jQuery.each(items, function (name, it) {
            var item = jQuery.extend({}, default_structure, it);
            item.name = name;
            var notification = jQuery.extend({}, default_structure.notification, it.notification || {});
            notification.body = item.content;

            notification.auto_show = false;
            if (item.actions.length) {
              notification.delay = 0;
            }
            notification.callbacks = {
              beforeShow: function (notif) {
                if (item.beforeShow) {
                  item.beforeShow(notif, self);
                }
              },
              afterShow: function (notif) {
                if (item.afterShow) {
                  item.afterShow(notif, self);
                }
              },
              beforeClose: function (notif) {
                if (item.beforeClose) {
                  item.beforeClose(notif, self);
                }
              },
              afterClose: function (notif) {
                if (item.afterClose) {
                  item.afterClose(notif, self);
                }
                _previous_item_name = notif.name;
              }
            };

            notification.actions = [];

            if (item.show_actions) {
              if (item.back) {
                var back_label = item.back_label;
                if (!back_label) {
                  back_label = 'Back';
                }
                notification.actions.push({
                  name: 'back',
                  label: back_label,
                  cb: function (e, story, notif) {
                    story.previous();
                  }
                });
              }

              if (item.forward) {
                var forward_label = item.forward_label;
                if (!forward_label) {
                  forward_label = 'Back';
                }
                notification.actions.push({
                  name: 'forward',
                  label: forward_label,
                  cb: function (e, story, notif) {
                    story.next();
                  }
                });
              }

              if (item.actions.length) {
                jQuery.each(item.actions, function (i, act) {
                  notification.actions.push(item.actions[i]);
                });
              }
            }

            if (!_first_item_name) {
              _first_item_name = name;
            }
            _last_item_name = name;

            item.notification = notification;

            _storyline[name] = item;
          });
          return _storyline;
        },
        start: function () {
          this._showNotification(_storyline[_first_item_name]);
        },
        stop: function () {
          _current_item.close();
          _current_item = null;
          _previous_item_name = null;
        },
        next: function () {
          _current_item.close();
          if (_storyline[_current_item.name].forward) {
            var next_item = _storyline[_current_item.name].forward;
            this._showNotification(_storyline[next_item]);
          } else {
            this._showNotification(_storyline[_last_item_name]);
          }
        },
        previous: function () {
          if (_previous_item_name) {
            _current_item.close();
            if (_storyline[_current_item.name].back) {
              var prev_item = _storyline[_current_item.name].back;
              this._showNotification(_storyline[prev_item]);
            } else {
              this._showNotification(_storyline[_previous_item_name]);
            }
          } else {
            this.stop();
          }
        },
        _showNotification: function (item) {
          _current_item = new MidgardNotification(jQuery('body'), item.notification);
          _current_item.setStory(this);
          _current_item.setName(item.name);
          _current_item.show();

          return _current_item;
        }
      };
      base.constructor(options);
      delete base.constructor;
      if (items) {
        base.setStoryline(items);
      }

      return base;
    };

  var _createTutorialStoryline = {
    'start': {
      content: 'Welcome to CreateJS tutorial!',
      forward: 'toolbar_toggle',
      forward_label: 'Start tutorial',
      actions: [{
        name: 'quit',
        label: 'Quit',
        cb: function (a, story, notif) {
          story.stop();
        }
      }]
    },
    'toolbar_toggle': {
      content: 'This is the CreateJS toolbars toggle button.<br />You can hide and show the full toolbar by clicking here.<br />Try it now.',
      forward: 'edit_button',
      show_actions: false,
      afterShow: function (notification, story) {
        jQuery('body').on('midgardtoolbarstatechange', function (event, options) {
          if (options.display == 'full') {
            story.next();
            jQuery('body').off('midgardtoolbarstatechange');
          }
        });
      },
      notification: {
        bindTo: '#midgard-bar-hidebutton',
        timeout: 0,
        gravity: 'TL'
      }
    },
    'edit_button': {
      content: 'This is the edit button.<br />Try it now.',
      show_actions: false,
      afterShow: function (notification, story) {
        jQuery('body').on('midgardcreatestatechange', function (event, options) {
          if (options.state == 'edit') {
            story.next();
            jQuery('body').off('midgardcreatestatechange');
          }
        });
      },
      notification: {
        bindTo: '.ui-button[for=midgardcreate-edit]',
        timeout: 0,
        gravity: 'TL'
      }
    },
    'end': {
      content: 'Thank you for watching!<br />Happy content editing times await you!'
    }
  };

  jQuery.widget('Midgard.midgardNotifications', {
    options: {
      notification_defaults: {
        class_prefix: 'midgardNotifications',
        position: 'top right'
      }
    },

    _create: function () {
      this.classes = {
        container: this.options.notification_defaults.class_prefix + '-container'
      };

      if (jQuery('.' + this.classes.container, this.element).length) {
        this.container = jQuery('.' + this.classes.container, this.element);
        this._parseFromDOM();
      } else {
        this.container = jQuery('<div class="' + this.classes.container + '" />');
        this.element.append(this.container);
      }
    },

    destroy: function () {
      this.container.remove();
      jQuery.Widget.prototype.destroy.call(this);
    },

    _init: function () {},

    _parseFromDOM: function (path) {

    },

    showStory: function (options, items) {
      var story = new MidgardNotificationStoryline(options, items);
      story.start();

      return story;
    },

    create: function (options) {
      options = jQuery.extend({}, this.options.notification_defaults, options || {});

      var item = new MidgardNotification(this.container, options);
      item.show();

      return item;
    },

    showTutorial: function () {
      this.showStory({}, _createTutorialStoryline);
    }
  });

})(jQuery);
