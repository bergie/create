Create - On-site web editing interface
======================================

Create, from the [Midgard Project](http://www.midgard-project.org/) is a comprehensive web editing interface for Content Management Systems. It is designed to provide a modern, fully browser-based HTML5 environment for managing content. Create can be adapted to work on almost any content management backend.

## Features

* Making RDFa-annotated content on pages editable
* Managing collections of content (add, remove)
* Local, in-browser storage and retrieval of unsaved content
* Adaptable connector for communicating with the back-end system
* Running workflows (approval, etc.) for content items
* Browsing and reverting content history

## Future plans

* Adopt the [Web Intents](http://webintents.org/) specification for better image and link handling
* Content annotation and auto-tagging with [Apache Stanbol](http://incubator.apache.org/stanbol/)

## Dependencies

* [Hallo](http://bergie.github.com/hallo/) - distraction-free content editor (optionally, [Aloha Editor](http://aloha-editor.org/))
* [VIE](https://github.com/bergie/vie) - editable RDFa library
* [Backbone.js](http://documentcloud.github.com/backbone/) - client-side management of models, views, and collections
* [jQuery UI](http://jqueryui.com/) - widget and effect library
* [Bootstrap](http://twitter.github.com/bootstrap/) - CSS UI framework
* [Modernizr](http://www.modernizr.com/) - HTML5 browser compatibility library

## Integrating Create with your CMS

In nutshell, you have to do the following:

* Annotate your content with RDFa
* Include the Create JavaScript file(s)
* Implement [Backbone.sync](http://documentcloud.github.com/backbone/#Sync) for your back-end

## Status

This repository contains the new version of Create that is having its dependencies on [Midgard MVC](http://new.midgard-project.org/midgardmvc/) removed so that it can work with any back-end system. This work is still ongoing, and so most of the functionality doesn't work yet.
