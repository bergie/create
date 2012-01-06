/**
 * Extend this base for any editing widget.
 */
(function(jQuery, undefined) {
    jQuery.widget("Create.editWidget",{
    	options:{
    		disabled: false
    	},
    	// override to enable the widget
    	enable: function(){
    		console.log("enabling edit");
     		this.options.disabled=false;
    		this.element.attr("contenteditable", "true");
    		
    	},
    	// override to disable the widget
    	disable: function(disable){
    		this.element.attr("contenteditable", "false");
    		this.options.disabled=true;
    	},
    	// called by the jquery ui plugin factory when creating the widget
    	_create: function(){
    		this._registerWidget();
    		this._initialize();
    		if (!this.options.disabled){
    			this.enable();
    		}
     	},
     	// override this function to initialize the widget functions
    	_initialize: function(){
    		var self=this;
    		var before=this.element.html();
    		this.element.bind('blur keyup paste', function(event) {
    			console.log("checking for modifications");
    			if (self.options.disabled){
    				console.log("widget is disabled");
    				return;
    			}
    			var current=jQuery(this).html();
    			  if (before != current) {
    				  console.log("element content has been modified");
    				  before = current;
    				  self.options.modified(current);
    			  }
    		});
    	},
    	// used to register the widget name with the DOM element
    	_registerWidget: function(){
    		this.element.data("createWidgetName", this.widgetName);
    	}
    });
})(jQuery);