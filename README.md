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
* Wrapper for using Create inside [Google Web Toolkit](http://code.google.com/webtoolkit/) via [VIE-GWT](https://github.com/alkacon/vie-gwt)

## Dependencies

* [Hallo](http://bergie.github.com/hallo/) - distraction-free content editor (optionally, [Aloha Editor](http://aloha-editor.org/))
* [VIE](https://github.com/bergie/vie) - editable RDFa library
* [Backbone.js](http://documentcloud.github.com/backbone/) - client-side management of models, views, and collections
* [jQuery UI](http://jqueryui.com/) - widget and effect library
* [Modernizr](http://www.modernizr.com/) - HTML5 browser compatibility library

## Integrating Create with your CMS

In nutshell, you have to do the following:

* Annotate your content with RDFa
* Include the Create dependencies (jQuery, jQuery UI, Underscore, Backbone, VIE, the editor of your choice)
* Include the Create JavaScript file (see `examples/create.js` and `examples/create-min.js`)
* Implement [Backbone.sync](http://documentcloud.github.com/backbone/#Sync) for your back-end

[Blogsiple](https://github.com/bergie/blogsiple) is a [Node.js](http://nodejs.org/) based CMS integration testbed for Create. It may provide useful examples on how the connection between Create and a REST-capable web tool works.

### RDFa annotations

Create uses the [VIE](http://viejs.org/) library to turn content in your pages into editable [Backbone models](http://documentcloud.github.com/backbone/#Model). This process is guided by [RDFa annotations](http://www.w3.org/TR/xhtml-rdfa-primer/#id84624) that let your web framework to explain the content model being shown on the pages.

#### Annotating entities

The main editable unit in Create is an entity. For example, you could make a blog post editable with this mark-up:

    <div about="http://example.net/blog/my-post" typeof="sioc:Post">
      <h1 property="dcterms:title">Blog post title</h1>
      <div property="sioc:content">
        ...
      </div>
    </div>

This is enough to tell Create that the div contains an editable blog post entity. The important points here are:

* `about` gives the identifier of an object. The identifiers should be [URIs](http://en.wikipedia.org/wiki/Uniform_resource_identifier), but basically anything that your back-end will understand is fine
* `typeof` is not necessary, but it tells us that the editable entity is a [blog post](http://rdfs.org/sioc/spec/#term_Post)
* `property` tells that the h1 contains the title of the post, and the div contains the contents. These become attributes of our Backbone model instance

#### Annotating collections

Relationships between entities allow you to communicate structured content to Create, which will turn them into [Backbone collections](http://documentcloud.github.com/backbone/#Collection). For example, to annotate a list of blog posts:

    <div about="http://example.net/blog/" rel="dcTerms:hasPart">
      <div about="http://example.net/my-post">...</div>
      <div about="http://example.net/second-post">...</div>
    </div>

This tells Create that there is a blog entity, which contains a collection of two posts. The important things here are:

* The first `about` identifies also the blog post container as an entity
* `rel` tells that there is a relation between the blog container, and the blog posts under it

Create will use the first entity inside a collection as a "template", and knows how to add or remove entities from the collection. In _Edit_ mode the user would see an _Add_ button next to the collection.

### Starting Create

Starting Create:

    jQuery(document).ready(function() {
        jQuery('body').midgardCreate({
            url: function() { return '/some/backend/url'; }
        });
    });

You can pass Create configuration options when calling the `midgardCreate` widget. For example, to use Aloha Editor instead of Hallo, do:

    jQuery('body').midgardCreate({
        url: function() { return '/some/backend/url'; },
        editor: 'aloha',
        workflows: {
            url: function(model) {
                return '/some/backend/workflows/fetch/url/' + model.id;
            }
        }
    });

### Communications with the back-end

Create communicates with your server-side system using [Backbone.sync](http://documentcloud.github.com/backbone/#Sync). By default this means that we send and retrieve content encoded in [JSON-LD](http://json-ld.org/) over XmlHttpRequest calls.

If you're using this default approach, it is important to provide the URL of the endpoint on your server that you want Backbone and Create to talk with. This can be done by passing a string when initializing `midgardCreate`:

    jQuery('body').midgardCreate({
        url: function() { return '/some/backend/url'; }
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
* `midgardstoragesave`: when save to back-end has been initiated. Event data contains `models` key with all the changed entities
* `midgardstoragesaved`: when save has completed succesfully

You can use normal [jQuery event methods](http://api.jquery.com/category/events/) to deal with these events.

## Building Create

Use the supplied `Cakefile` to generate the merged JavaScript file for Create:

    $ cake build

You can also generate a minified version (requires uglifyjs):

    $ cake min

## Read more

* [Introducing the Midgard Create user interface](http://bergie.iki.fi/blog/introducing_the_midgard_create_user_interface/)
* [Using RDFa to make a web page editable](http://bergie.iki.fi/blog/using_rdfa_to_make_a_web_page_editable/)
* [Midgard Create and VIE presentation in the Aloha Editor conference](http://bergie.iki.fi/blog/midgard_create_and_vie_in_the_aloha_editor_conference/)
* [Proposal for using Create as the reference UI in Symfony CMF](http://groups.google.com/group/symfony-cmf-devs/browse_thread/thread/6c609030661cee08)
* [CreateJS integration module for Drupal](http://drupal.org/sandbox/dominikb1888/1388900)

## Discussion

* [CreateJS Google Groups mailing list](http://groups.google.com/group/createjs)
* [`#iks` IRC channel on Freenode](irc://irc.freenode.net/iks)

## Similar projects

* [Etch](http://etchjs.com/)

## Using Aloha Editor

By default, Create uses the [Hallo Editor](http://bergie.github.com/hallo/). To use Create with [Aloha Editor](http://aloha-editor.org/) you need to:

* [Download the latest version of Aloha Editor](http://aloha-editor.org/builds/development/latest.zip)
* Extract the archive file and move the `aloha` directory into the `create/deps` folder -- check to have it like this: `create/deps/aloha/lib/aloha.js`
* For more information about using Aloha Editor see the [Aloha Editor Guides](http://aloha-editor.org/builds/development/latest/doc/guides/output/)

Using Aloha Editor with Create is covered by Aloha's FOSS License Exception:

> Aloha Editor’s Free and Open Source Software ("FOSS") License Exception allows developers of FOSS applications to include Aloha Editor with their FOSS applications. Aloha Editor is typically licensed pursuant to version 3 of the General Afero Public License ("AGPLv3"), but this exception permits distribution of Aloha Editor with a developer’s FOSS applications licensed under the terms of another FOSS license listed below [MIT license is included], even though such other FOSS license may be incompatible with the AGPLv3.

### Running Unit Tests

Direct your browser to the `test/index.html` file to run Create's [QUnit](http://docs.jquery.com/Qunit) tests.

#### Unit tests on Node.js

You need Node.js and [NPM](http://npmjs.org/). Then just run:

    $ npm install --dev
    $ npm test

#### Continuous integration

Create uses [Travis](http://travis-ci.org/) for continuous integration. Simply add your fork there and every time you push you'll get the tests run.

[![Build Status](https://secure.travis-ci.org/bergie/create.png)](http://travis-ci.org/bergie/create)
