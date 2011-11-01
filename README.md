Create - On-site web editing interface
======================================

Create, from the [Midgard Project](http://www.midgard-project.org/) is a comprehensive web editing interface for Content Management Systems. It is designed to provide a modern, fully browser-based HTML5 environment for managing content. Create can be adapted to work on almost any content management backend.

![Midgard Create user interface, in March 2011](http://bergie.iki.fi/static/1/1e04599abfee694459911e0bf1021b4fddbed1bed1b_midgardcreate-save-transition-small.png)

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

## Read more

* [Introducing the Midgard Create user interface](http://bergie.iki.fi/blog/introducing_the_midgard_create_user_interface/)
* [Using RDFa to make a web page editable](http://bergie.iki.fi/blog/using_rdfa_to_make_a_web_page_editable/)
* [Midgard Create and VIE presentation in the Aloha Editor conference](http://bergie.iki.fi/blog/midgard_create_and_vie_in_the_aloha_editor_conference/)
* [Proposal for using Create as the reference UI in Symfony CMF](http://groups.google.com/group/symfony-cmf-devs/browse_thread/thread/6c609030661cee08)

## Status

This repository contains the new version of Create that is having its dependencies on [Midgard MVC](http://new.midgard-project.org/midgardmvc/) removed so that it can work with any back-end system. This work is still ongoing, and so most of the functionality doesn't work yet.
