Create.js ChangeLog
===================

## 1.0.0beta1 (git master)

* The basic `editWidget` now ignores all formatting
* CKEditor 4 is now configurable using Create's `editorOptions`
* Initial support for the [Medium Editor](http://daviferreira.github.io/medium-editor/)

## 1.0.0alpha4 (September 10th 2013)

Entity editing:

* Terminology: _midgardEditable_ is now known as an _editable entity widget_, and the editors it runs for various properties are known as _property editor widgets_
* Entity editing widget now accepts two callbacks for instantiating decorators for entities and their properties in the DOM. This is handy for CMSs that want to visualize what can be edited
  * `decorateEditableEntity` callback is called for the entity loaded to the editable widget
  * `decoratePropertyEditor` callback is called for each property of the entity
* Entity editables are now able to run without _VIE Collection view_ being defined
* Events emitted by the editing widgets now carry the new terminology. The old event data keys are still available as fallbacks:
  * `entity`: VIE entity instance (Backbone.js model)
  * `editableEntity`: _midgardEditable_ widget instance
  * `entityElement`: DOM element containing the entity
* Events emitted by the property editing widgets now carry the new terminology. The old event data keys are still available as fallbacks:
  * `predicate`: name of the property being edited
  * `propertyEditor`: editor instance
  * `propertyElement`: DOM element containing the property
* The state model for entity editing was clarified, with the following different states instead of enabled, disabled, and active:
  * _Inactive_: editable is loaded but disabled
  * _Candidate_: editable is enabled but not activated
  * _Highlight_: user is hovering over the editable (not set by Editable widget directly)
  * _Activating_: an editor widget is being activated for user to edit with it (skipped for editors that activate instantly)
  * _Active_: user is actually editing something inside the editable
  * _Changed_: user has made changes to the editable
  * _Invalid_: the contents of the editable have validation errors
* The `modified` event was renamed to `changed` to follow the new states
* New public methods `setState` and `getState` were added for manipulating the state from the application controller
  * States are passed as strings corresponding to the new editing states (for example, `inactive` or `changed`)
  * The `setState` method has an optional `predicate` parameter for targeting a particular property editor with the state change
* New Rich Text Editors
  * [CKEditor](http://ckeditor.com/) 4
  * TinyMCE 4

Metadata editing:

* New _midgardMetadata_ widget was added to act as the controller for all different metadata editors
* _midgardTags_ was refactored to run inside the metadata editing widget

  This changes tags initialization from:

  ``` javascript
  jQuery('body').midgardCreate({
    tags: true
  });
  ```

  to:

  ``` javascript
  jQuery('body').midgardCreate({
    metadata: {
      midgardTags: {}
    }
  });
  ```

Storage:

* The `revertChanges` method was made public, allowing external UIs to trigger reverting entities to their original states
* The `hasLocal` and `readLocal` methods were made public to allow manipulating localStorage from the application controller
* The `saveRemote` method was made public, allowing the application controller to trigger saving for a single entity
* new `save` and `saved` events are triggered for the whole set of entities being saved
* new `saveentity` and `savedentity` events are triggered for each entity being saved
* Options used when calling `saveRemote` are now passed on in the save-related events
* key prefix used with localStorage is now configurable

Create.js internals:

* The whole library has been migrated to use jQuery [`on` and `off`](http://api.jquery.com/category/events/event-handler-attachment/) methods instead of `bind` and `unbind`
* All widgets were migrated to the *Midgard* namespace to maintain consistency
* Switched to Grunt for builds
* Switched to Bower for dependency handling
* Moved built version to `dist/create.js`
* New build option for creating a smaller edit-only version of Create.js: `$ grunt editonly`
* The build process was improved to work also on Mac OS X

Dependencies:

* [VIE](https://github.com/bergie/VIE) was updated to 2.1.0
* [Hallo](https://github.com/bergie/hallo) was updated to the latest git version
* [jQuery-Tags-Input](https://github.com/xoxco/jQuery-Tags-Input) -- used by the _midgardTags_ widget -- was updated to latest git version
* jQuery was updated to version 1.9.1 and jQuery UI to version 1.10.2. Some compatibiity work still remains

Development:

* The build environment of Create.js was switched to [Grunt](http://gruntjs.com)

Localization:

* Hebrew and Romanian translations were added

_Thanks to the [Drupal Edit](http://drupal.org/project/edit) team for major contributions to this release!_

## 1.0.0alpha3 (September 27th 2012)

Collection editing:

* _Add_ buttons are now shown only for collections VIE is able to add views for
* New _midgardCollectionAddBetween_ widget for more flexible collection editing
* Collection widgets are now able to [ask the user for the type](http://bergie.iki.fi/blog/create-collections/) to add in case of collections that can multiple types inside them
* Collection widgets are aware of possible size constraints in VIE collections. If a collection is full, the _Add_ buttons are not shown

User interface:

* Support for keyboard shortcuts if the [Mousetrap](https://github.com/ccampbell/mousetrap) library is available:
  * _Ctrl-e_: enter editing mode
  * _Esc_: leave editing mode
  * _Ctrl-s_: save changes
  * _Ctrl-Shift-i_: ignore local modifications (when entering edit mode)
  * _Ctrl-Shift-r_: revert to local modifications (when entering edit mode)

Localization:

* Support for localizing the Create.js user interface. You can pass custom localization callbacks using the `localize` option of the widgets
* First batch of languages:
  * Swedish
  * Bulgarian
  * Spanish
  * Czech
  * Russian
  * Polish
  * Dutch
  * Danish
  * Italian
  * Norwegian
  * German
  * French
  * Brazilian Portuguese
  * Finnish

Storage:

* Autosaving now saves changes using Backbone's `silent` option so that it doesn't modify the DOM elements user is editing
* The `checkRestore` method was made public to allow external web applications to restore content
* The `saveRemoteAll` method was made public

Create.js internals:

* The VIE DOM service used with Create.js is now configurable. You can replace the default _RDFa Service_ with your own implementation to support custom mark-up
  * The custom DOM service can be passed via the `domService` key of Create.js widget options
* All Create.js code is now being run in [JavaScript strict mode](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Functions_and_function_scope/Strict_mode)
* Continuous Integration of Create.js was switched to using PhantomJS with QUnit
* Create's HTML output was changed to use [Underscore Templates](http://underscorejs.org/#template) for better configurability

Dependencies:

* [VIE](https://github.com/bergie/VIE) was updated to latest git version
* [Hallo](https://github.com/bergie/hallo) was updated to the latest git version
  * Hallo now depends on the [Rangy](http://code.google.com/p/rangy/) library
* The [Modernizr](http://modernizr.com/) dependency was removed

_Thanks to the [TYPO3 Neos](http://neos.typo3.org/) team for great collaboration on this release! We're also grateful for the translation contributions from all around the world._
