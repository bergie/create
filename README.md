Create - On-site web editing interface
======================================

![Create logo](https://github.com/bergie/create/raw/master/design/create.png)

Create, from the [Midgard Project](http://www.midgard-project.org/), is a comprehensive web editing interface for Content Management Systems. It is designed to provide a modern, fully browser-based HTML5 environment for managing content. Create can be adapted to work on almost any content management backend.

![Midgard Create user interface, in March 2011](http://bergie.iki.fi/static/1/1e045994d03c25e459911e0ab235550c1aac901c901_midgardcreate-enter-edit-state-small.png) ![Midgard Create user interface, in March 2011](http://bergie.iki.fi/static/1/1e04599abfee694459911e0bf1021b4fddbed1bed1b_midgardcreate-save-transition-small.png)

## Features

* Making RDFa-annotated content on pages editable
* Managing collections of content (add, remove)
* Local, in-browser storage and retrieval of unsaved content
* Adaptable connector for communicating with the back-end system
* Running workflows (approval, etc.) for content items
* Browsing and reverting content history
* Easy rebranding of the interface with some CSS

## Future plans

* Adopt the [Web Intents](http://webintents.org/) specification for better image and link handling
* Content annotation and auto-tagging with [Apache Stanbol](http://incubator.apache.org/stanbol/)

## Dependencies

* [Hallo](http://bergie.github.com/hallo/) - distraction-free content editor (optionally, [Aloha Editor](http://aloha-editor.org/))
* [VIE](https://github.com/bergie/vie) - editable RDFa library
* [Backbone.js](http://documentcloud.github.com/backbone/) - client-side management of models, views, and collections
* [jQuery UI](http://jqueryui.com/) - widget and effect library
* [Modernizr](http://www.modernizr.com/) - HTML5 browser compatibility library

## Integrating Create with your CMS

In nutshell, you have to do the following:

* Annotate your content with RDFa
* Include the Create JavaScript file(s)
* Implement [Backbone.sync](http://documentcloud.github.com/backbone/#Sync) for your back-end

### Starting Create

Starting Create:

    jQuery(document).ready(function() {
        jQuery('body').midgardCreate({
            url: '/some/backend/url'
        });
    });

You can pass Create configuration options when calling the `midgardCreate` widget. For example, to use Aloha Editor instead of Hallo, do:

    jQuery('body').midgardCreate({
        url: '/some/backend/url',
        editor: 'aloha'
    });

### Communications with the back-end

Create communicates with your server-side system using [Backbone.sync](http://documentcloud.github.com/backbone/#Sync). By default this means that we send and retrieve content encoded in [JSON-LD](http://json-ld.org/) over XmlHttpRequest calls.

If you're using this default approach, it is important to provide the URL of the endpoint on your server that you want Backbone and Create to talk with. This can be done by passing a string when initializing `midgardCreate`:

    jQuery('body').midgardCreate({
        url: '/some/backend/url'
    });

When implemented this way, all communications from Create will happen using normal RESTful HTTP calls to that URL.

* Creating a new object makes a `HTTP POST` to the URL
* Updating or fetching an object makes a `HTTP PUT` or `HTTP GET` to that URL with the `id` of the object appended (for example `/some/backend/url/objectId`)

If you need more flexibility with your URL structure, you can also pass a function that returns the URL for an object.

You can override this default communications layer by [implementing your own](http://stackoverflow.com/questions/5096549/how-to-override-backbone-sync) `Backbone.sync` method. Some examples:

* [Backbone.sync with CouchDB](https://github.com/janmonschke/backbone-couchdb)
* [Backbone.sync with Amazon SimpleDB](https://github.com/developmentseed/backbone-simpledb)

### Events

Create is an event-based user interface. Normally integrators shouldn't need to deal with these events, but they're explained here in case of some customization needs.

* `midgardcreatestatechange`: when user switches between _browse_ and _edit_ modes. Event data contains an object with key `state` telling the state being changed to
* `midgardtoolbarstatechange`: when user opens or minimizes the toolbar. Event data contains an object with key `display` telling the new state
* `midgardeditableenable`: when an object has been made editable. Event data contains an object with key `instance` providing the Backbone model instance and `entityElement` providing the element containing the object
* `midgardeditabledisable`: when an object has been made non-editable. Event data contains an object with key `instance` providing the Backbone model instance and `entityElement` providing the element containing the object
* `midgardeditableactivated`: when a particular property of an object has been activated in an editor. Event data contains keys `property`, `instance`, `element` and `entityElement`
* `midgardeditabledeactivated`: when a particular property of an object has been deactivated in an editor. Event data contains keys `property`, `instance`, `element` and `entityElement`
* `midgardeditablechanged`: when a particular property of an object has been changed in an editor. Event data contains keys `property`, `instance`, `element` and `entityElement`

You can use normal [jQuery event methods](http://api.jquery.com/category/events/) to deal with these events.

## Read more

* [Introducing the Midgard Create user interface](http://bergie.iki.fi/blog/introducing_the_midgard_create_user_interface/)
* [Using RDFa to make a web page editable](http://bergie.iki.fi/blog/using_rdfa_to_make_a_web_page_editable/)
* [Midgard Create and VIE presentation in the Aloha Editor conference](http://bergie.iki.fi/blog/midgard_create_and_vie_in_the_aloha_editor_conference/)
* [Proposal for using Create as the reference UI in Symfony CMF](http://groups.google.com/group/symfony-cmf-devs/browse_thread/thread/6c609030661cee08)

## Similar projects

* [Etch](http://etchjs.com/)

## Status

This repository contains the new version of Create that is having its dependencies on [Midgard MVC](http://new.midgard-project.org/midgardmvc/) removed so that it can work with any back-end system. This work is still ongoing, and so most of the functionality doesn't work yet.
