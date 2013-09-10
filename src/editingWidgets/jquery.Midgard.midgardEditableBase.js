/*
//     Create.js - On-site web editing interface
//     (c) 2012 Tobias Herrmann, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
*/
(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false document:false */
  'use strict';

  // # Base property editor widget
  //
  // This property editor widget provides a very simplistic `contentEditable`
  // property editor that can be used as standalone, but should more usually be
  // used as the base class for other property editor widgets.
  // This property editor widget is only useful for textual properties!
  //
  // Subclassing this base property editor widget is easy:
  //
  //     jQuery.widget('Namespace.MyWidget', jQuery.Create.editWidget, {
  //       // override any properties
  //     });
  jQuery.widget('Midgard.editWidget', {
    options: {
      disabled: false,
      vie: null
    },
    // override to enable the widget
    enable: function () {
      this.element.attr('contenteditable', 'true');
    },
    // override to disable the widget
    disable: function (disable) {
      this.element.attr('contenteditable', 'false');
    },
    // called by the jQuery UI plugin factory when creating the property editor
    // widget instance
    _create: function () {
      this._registerWidget();
      this._initialize();

      if (_.isFunction(this.options.decorate) && _.isFunction(this.options.decorateParams)) {
        // TRICKY: we can't use this.options.decorateParams()'s 'propertyName'
        // parameter just yet, because it will only be available after this
        // object has been created, but we're currently in the constructor!
        // Hence we have to duplicate part of its logic here.
        this.options.decorate(this.options.decorateParams(null, {
          propertyName: this.options.property,
          propertyEditor: this,
          propertyElement: this.element,
          // Deprecated.
          editor: this,
          predicate: this.options.property,
          element: this.element
        }));
      }
    },
    // called every time the property editor widget is called
    _init: function () {
      if (this.options.disabled) {
        this.disable();
        return;
      }
      this.enable();
    },
    // override this function to initialize the property editor widget functions
    _initialize: function () {
      var self = this;
      this.element.on('focus', function () {
        if (self.options.disabled) {
          return;
        }
        self.options.activated();
      });
      this.element.on('blur', function () {
        if (self.options.disabled) {
          return;
        }
        self.options.deactivated();
      });
      var before = this.element.text();
      this.element.on('keyup paste', function (event) {
        if (self.options.disabled) {
          return;
        }
        var current = jQuery(this).text();
        if (before !== current) {
          before = current;
          self.options.changed(current);
        }
      });
    },
    // used to register the property editor widget name with the DOM element
    _registerWidget: function () {
      this.element.data("createWidgetName", this.widgetName);
    }
  });
})(jQuery);
