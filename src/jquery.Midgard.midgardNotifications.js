/*
// jQuery(this.element).data('midgardNotifications').create({body: 'Content here!'});
// jQuery(this.element).data('midgardNotifications').create({
//     body: "Do you wan't to run tests now?",
//     actions: [
//         {
//             name: 'runtests', label: 'Run tests',
//             cb: function(e, notification) {
//                 alert('Running tests');
//                 notification.close();
//             }
//         },
//         {
//             name: 'cancel', label: 'Cancel',
//             cb: function(e, notification) {
//                 notification.close();
//             }
//         }
//     ]
// });
 */
(function(jQuery, undefined) {
    var _midgardnotifications_active = [];
    var MidgardNotification = function(parent, options) {
        var _defaults = {
            class_prefix: 'midgardNotifications',
            timeout: 3000, // Set to 0 for sticky
            auto_show: true,
            body: '',
            bindTo: null,
            gravity: 'T',
            effects: {
                onShow: function(item, cb) {item.animate({opacity: 'show'}, 600, cb)},
                onHide: function(item, cb) {item.animate({opacity: 'hide'}, 600, cb)}
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
	 	    constructor: function(options) {
	 	        _config = $.extend(_defaults, options || {});
	 	        
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
	 	    getId: function() {
	 	        return _id;
	 	    },
	 	    _generate: function() {
	 	        var outer, inner, content = null;
	 	        
                _item = outer = jQuery('<div class="'+_classes.item.wrapper+'-outer"/>');
                outer.css({
                    display: 'none'
                });
                inner = jQuery('<div class="'+_classes.item.wrapper+'-inner"/>');
                inner.appendTo(outer);
                
                if (_config.bindTo) {
                    outer.addClass(_classes.item.wrapper + '-binded');
                    
                    var arrow = jQuery('<div class="'+_classes.item.arrow+'"/>');
                    arrow.appendTo(outer);
                } else {
                    outer.addClass(_classes.item.wrapper + '-normal');
                }
	 	        
	 	        var content = jQuery('<div class="'+_classes.item.content+'"/>');
	 	        content.html(_config.body);
	 	        content.appendTo(inner);
	 	        
	 	        if (_config.actions.length) {
                    var actions_holder = jQuery('<div class="'+_classes.item.actions+'"/>');
                    actions_holder.appendTo(inner);
                    var _self = this;
                    jQuery.each(_config.actions, function(i, opts) {
                        var action = jQuery('<button name="'+opts.name+'" class="button-'+opts.name+'">'+opts.label+'</button>').button();
                        action.bind('click', function(e) {
                            if (_story) {
                                opts.cb(e, _story, _self);
                            } else {
                                opts.cb(e, _self);
                            }
                            
                        });
                        actions_holder.append(action);
                    });
                }
	 	        
	 	        if (_config.auto_show) {
	 	            this.show();
	 	        }
	 	        
	 	        this._setPosition();
	 	        
	 	        _id = _midgardnotifications_active.push(this);
	 	        
	 	        _parent.append(_item);
	 	    },
            _setPosition: function() {
                if (_config.bindTo) {
                    _bind_target = jQuery(_config.bindTo);
                    var trgt_w = _bind_target.outerWidth();
					var trgt_h = _bind_target.outerHeight();
					var trgt_l = _bind_target.offset().left;
					var trgt_t = _bind_target.offset().top;
					
					switch (_config.gravity) {
						case 'TL':
							properties = {
								'left'	: trgt_l,
								'top'	: trgt_t + trgt_h + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_TL');
							break;
						case 'TR'	:
							properties = {
								'left'	: trgt_l + trgt_w - _item.width() + 'px',
								'top'	: trgt_t + trgt_h + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_TR');
							break;
						case 'BL'	:
							properties = {
								'left'	: trgt_l + 'px',
								'top'	: trgt_t - _item.height() + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_BL');
							break;
						case 'BR'	:
							properties = {
								'left'	: trgt_l + trgt_w - _item.width() + 'px',
								'top'	: trgt_t - _item.height() + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_BR');
							break;
						case 'LT'	:
							properties = {
								'left'	: trgt_l + trgt_w + 'px',
								'top'	: trgt_t + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_LT');
							break;
						case 'LB'	:
							properties = {
								'left'	: trgt_l + trgt_w + 'px',
								'top'	: trgt_t + trgt_h - _item.height() + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_LB');
							break;
						case 'RT'	:
							properties = {
								'left'	: trgt_l - _item.width() + 'px',
								'top'	: trgt_t + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_RT');
							break;
						case 'RB'	:
							properties = {
								'left'	: trgt_l - _item.width() + 'px',
								'top'	: trgt_t + trgt_h - _item.height() + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_RB');
							break;
						case 'T'	:
							properties = {
								'left'	: trgt_l + trgt_w/2 - _item.width()/2 + 'px',
								'top'	: trgt_t + trgt_h + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_T');
							break;
						case 'R'	:
							properties = {
								'left'	: trgt_l - _item.width() + 'px',
								'top'	: trgt_t + trgt_h/2 - _item.height()/2 + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_R');
							break;
						case 'B'	:
							properties = {
								'left'	: trgt_l + trgt_w/2 - _item.width()/2 + 'px',
								'top'	: trgt_t - _item.height() + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_B');
							break;
						case 'L'	:
							properties = {
								'left'	: trgt_l + trgt_w  + 'px',
								'top'	: trgt_t + trgt_h/2 - _item.height()/2 + 'px'
							};
							_item.find('.'+_classes.item.arrow).addClass(_classes.item.arrow+'_L');
							break;
					}
					
					properties.position = 'absolute';
					_item.css(properties);
					
                    return;
                }
                
                if (!_config.position) {
                    _config.position = 'top right';
                }

                var marginTop = jQuery('.midgard-create', _parent).height();

                pos = {
                    position: 'fixed'
                };

                if (_config.position.match(/top/)) {
                    pos.top = marginTop + _midgardnotifications_active.length-1 + 20 + 'px';
                }
                if (_config.position.match(/bottom/)) {
                    pos.bottom = (_midgardnotifications_active.length-1 * item.height()) + item.height() + 10 + 'px';
                }
                if (_config.position.match(/right/)) {
                    pos.right = 20 + 'px';
                }
                if (_config.position.match(/left/)) {
                    pos.left = 20 + 'px';
                }

                _item.css(pos);
            },
	 	    show: function() {
	 	        var self = this;
	 	        
	 	        if (_config.callbacks.beforeShow) {
	 	            _config.callbacks.beforeShow(self);
	 	        }
	 	        
	 	        if (_config.bindTo) {
    	 	        var w_t	= jQuery(window).scrollTop();	 	        
    				var w_b = jQuery(window).scrollTop() + jQuery(window).height();				
    				var b_t = parseFloat(_item.offset().top, 10);
    				var e_t = _bind_target.offset().top;
    				var e_h = _bind_target.outerHeight();
			
    				if (e_t < b_t) {
    				    b_t = e_t;
    				}					
			
    				var b_b = parseFloat(_item.offset().top, 10) + _item.height();
    				if ((e_t + e_h) > b_b) {
    				    b_b = e_t + e_h;
    				}
				}
            
                if (_config.timeout > 0 && !_config.actions.length) {
	 	            setTimeout(function() {
	 	                self.close();
	 	            }, _config.timeout);
	 	        }
                
				if (_config.bindTo && (b_t < w_t || b_t > w_b) || (b_b < w_t || b_b > w_b)) {
					jQuery('html, body').stop()
					.animate({scrollTop: b_t}, 500, 'easeInOutExpo', function() {
						_config.effects.onShow(_item, function() {
        	 	            if (_config.callbacks.afterShow) {
            	 	            _config.callbacks.afterShow(self);
            	 	        }
        	 	        });
					});
				} else {
				    _config.effects.onShow(_item, function() {
    	 	            if (_config.callbacks.afterShow) {
        	 	            _config.callbacks.afterShow(self);
        	 	        }
    	 	        });
				}
	 	    },
	 	    close: function() {
	 	        var self = this;
	 	        if (_config.callbacks.beforeClose) {
	 	            _config.callbacks.beforeClose(self);
	 	        }	 	        
	 	        _config.effects.onHide(_item, function() {
    	 	        if (_config.callbacks.afterClose) {
    	 	            _config.callbacks.afterClose(self);
    	 	        }
    	 	        self.destroy();
	 	        });
	 	    },
	 	    destroy: function() {
	 	        var self = this;
                jQuery.each(_midgardnotifications_active, function(i,item) {
                    if (item) {
                        if (item.getId() == self.getId()) {
                            delete _midgardnotifications_active[i];
                        }
                    }
                });
	 	        jQuery(_item).remove();
	 	    },
	 	    setStory: function(story) {
	 	        _story = story;
	 	    },
	 	    setName: function(name) {
                _item.addClass(_classes.item.wrapper+'-custom-'+name);
                this.name = name;
	 	    }
	 	};
	 	base.constructor(options);
	 	delete base.constructor;
	 	    
 	    return base;
    };
    
    var MidgardNotificationStoryline = function(options, items) {
        var _defaults = {
	  	};
	 	var _config = {};
	 	var _storyline = {};
	 	var _current_notification = {};
	 	var _previous_item_name = null;
	 	var _first_item_name = null;
	 	var _last_item_name = null;
	 	
	 	var base = {
	 	    constructor: function(options) {
	 	        _config = $.extend(_defaults, options || {});
	 	    },
	 	    setStoryline: function(items) {
	 	        var default_structure = {
	 	            content: '',
	 	            actions: [],
	 	            show_actions: true,
	 	            notification: {}, // Notification options to override
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
	 	        
	 	        jQuery.each(items, function(name, it) {
	 	            var item = jQuery.extend({}, default_structure, it);
	 	            item.name = name;
	 	            var notification = jQuery.extend({}, default_structure.notification, it.notification || {});
	 	            notification.body =  item.content;
	 	            
	 	            notification.auto_show = false;
	 	            if (item.actions.length) {
	 	                notification.delay = 0;
	 	            }	 	            
	 	            notification.callbacks = {
	 	                beforeShow: function(notif) {
    	 	                if (item.beforeShow) {
    	 	                    item.beforeShow(notif, self);
    	 	                }
    	 	            },
    	 	            afterShow: function(notif) {
    	 	                if (item.afterShow) {
    	 	                    item.afterShow(notif, self);
    	 	                }
    	 	            },
    	 	            beforeClose: function(notif) {
    	 	                if (item.beforeClose) {
    	 	                    item.beforeClose(notif, self);
    	 	                }
    	 	            },
    	 	            afterClose: function(notif) {
    	 	                if (item.afterClose) {
    	 	                    item.afterClose(notif, self);
    	 	                }
    	 	                _previous_item_name = notif.name;
    	 	            }
	 	            };
	 	            
 	                notification.actions = [];
	 	            
	 	            if (item.show_actions) {
	 	                if (item.back) {
    	 	                back_label = item.back_label;
    	 	                if (!back_label) {
    	 	                    back_label = 'Back';
    	 	                }
    	 	                notification.actions.push({
    	 	                    name: 'back',
    	 	                    label: back_label,
    	 	                    cb: function(e, story, notif) {
                                    story.previous();
                                }
    	 	                });
    	 	            }

    	 	            if (item.forward) {
    	 	                forward_label = item.forward_label;
    	 	                if (!forward_label) {
    	 	                    forward_label = 'Back';
    	 	                }
    	 	                notification.actions.push({
    	 	                    name: 'forward',
    	 	                    label: forward_label,
    	 	                    cb: function(e, story, notif) {
                                    story.next();
                                }
    	 	                });
    	 	            }

    	 	            if (item.actions.length) {
    	 	                jQuery.each(item.actions, function(i, act) {
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
	 	    start: function() {
	 	        this._showNotification(_storyline[_first_item_name]);
	 	    },
	 	    stop: function() {
	 	        _current_item.close();
	 	        _current_item = null;
	 	        _previous_item_name = null;
	 	    },
	 	    next: function() {
	 	        _current_item.close();
	 	        if (_storyline[_current_item.name].forward) {
	 	            next_item = _storyline[_current_item.name].forward;
    	 	        this._showNotification(_storyline[next_item]);
	 	        } else {
	 	            this._showNotification(_storyline[_last_item_name]);
	 	        }
	 	    },
	 	    previous: function() {
	 	        if (_previous_item_name) {
	 	            _current_item.close();
	 	            if (_storyline[_current_item.name].back) {
    	 	            prev_item = _storyline[_current_item.name].back;
        	 	        this._showNotification(_storyline[prev_item]);
    	 	        } else {
    	 	            this._showNotification(_storyline[_previous_item_name]);
    	 	        }
	 	        } else {
	 	            this.stop();
	 	        }
	 	    },
	 	    _showNotification: function(item) {
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
            actions: [
                {
                    name: 'quit',
                    label: 'Quit',
                    cb: function(a, story, notif) {
                        story.stop();
                    }
                }
            ]
        },
        'toolbar_toggle': {
            content: 'This is the CreateJS toolbars toggle button.<br />You can hide and show the full toolbar by clicking here.<br />Try it now.',
            forward: 'edit_button',
            show_actions: false,
            afterShow: function(notification, story) {
                jQuery('body').bind('midgardtoolbarstatechange', function(event, options) {
                    if (options.display == 'full') {
                        story.next();
                        jQuery('body').unbind('midgardtoolbarstatechange');
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
            afterShow: function(notification, story) {
                jQuery('body').bind('midgardcreatestatechange', function(event, options) {
                    if (options.state == 'edit') {
                        story.next();
                        jQuery('body').unbind('midgardcreatestatechange');
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
        
        _create: function() {
            this.classes = {
                container: this.options.notification_defaults.class_prefix + '-container'
            };
            
            if (jQuery('.'+this.classes.container, this.element).length) {
                this.container = jQuery('.'+this.classes.container, this.element);
                this._parseFromDOM();
            } else {
                this.container = jQuery('<div class="'+this.classes.container+'" />');                
                this.element.append(this.container);
            }
        },
        
        destroy: function() {
            this.container.remove();
            $.Widget.prototype.destroy.call(this);
        },
        
        _init: function() {            
        },
        
        _parseFromDOM: function(path) {
            
        },
        
        showStory: function(options, items) {
            var story = new MidgardNotificationStoryline(options, items);
            story.start();
            
            return story;
        },
        
        create: function(options) {
            options = jQuery.extend({}, this.options.notification_defaults, options || {});
            
            item = new MidgardNotification(this.container, options);
 	        item.show();
 	        
 	        return item;
        },
        
        showTutorial: function() {
            this.showStory({}, _createTutorialStoryline);
        }
    });
    
})(jQuery);