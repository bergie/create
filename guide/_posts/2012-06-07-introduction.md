---
layout: document
title: Introduction
name: intro
---
Create.js was originally written in 2010 as the next-generation content [editing interface of Midgard CMS](http://bergie.iki.fi/blog/introducing_the_midgard_create_user_interface/). [Henri Bergius](http://bergie.iki.fi) presented it in the Aloha Editor developer conference in Vienna last year, and the TYPO3 developers expressed interest in reusing the codebase.

Because of this we started extracting the various parts of the Create UI into their own, reusable components. The first one was [VIE](http://viejs.org/), which provides the underlaying management of editable objects. In basic use scenario, it loads content annotated with RDFa from the web page, populates it into [Backbone.js](http://backbonejs.org/) Models and Collections, and then creates Backbone Views for the original RDFa-annotated parts of DOM.

This way the DOM will automatically stay in sync when data changes, whether that happens by user interaction like editing, or through some server communications (we've done [collaborative editing demos](https://github.com/bergie/ViePalsu) over WebSockets, for instance).

Backbone.js is used there for two reasons:

* It handles the management of data in Models and Collections, and the connection of those to Views in an elegant way
* Backbone.Sync is a very good abstraction when we need to be able to persist/retrieve content from various different CMS back-ends

Later in 2011 the German AI Research Institute (DFKI) and Salzburg Research joined the VIE effort through the EU-funded [IKS Project](http://www.iks-project.eu/). This enabled us to make the library a lot more capable, adding type information, proper namespace handling, and connections with other semantic tools like [Apache Stanbol](http://incubator.apache.org/stanbol/) and [DBpedia](http://dbpedia.org/About).

The Create.js interface was then rebuilt on top of this new VIE library by writing a bunch of [jQuery UI widgets](http://sebastian.germes.in/blog/2011/07/jquery-ui-widget-factory-v-1-8/). This way we have an overall default UX that we can ship, but still provide a bunch of different widgets for CMS vendors to pick-and-choose.

## Create.js widgets

* **Editable**: makes an RDFa entities (as identified by `about`) editable with some editing widget (now plain contentEditable, [Aloha](http://aloha-editor.org), and [Hallo](http://hallojs.org) supported, more to come). Provides the events like "modified" of those widgets in a uniform way. Editable also deals with Collections, allowing user to add/remove items from them
* **Storage**: provides localStorage save/restore capability, and keeps track of what entities ought to be saved to the back-end
* **Workflows**: retrieves workflows that user can active for a given  ntity from the back-end and handles running them. These could be simpl  things like publish/unpublish and delete, or more complex workflows
* **Notifications**: notification bubbles/dialogs that can be used for telling user what has happened ("X has been saved successfully"), or query them for what they want to do ("You have X local modifications for this page. Restore/Ignore")
* **Tags**: content tagging widget
* **Toolbar**: holder widget for a toolbar overlay where widgets like
Editable, Storage, and Workflows can place buttons
* **Create**: ties all of these together to the default UX

Some CMSs use the full Create UX, and some use just parts to provide the UX they want to have. Examples of custom UXs include [Symfony CMF](http://blog.iks-project.eu/semantic-enhanced-cmf-editor-now-available/) and [OpenCms](http://iks.alkacon.com/en/).

## Create.js integration in nutshell

In nutshell, you have to do the following:

* Annotate your content with RDFa
* Include the Create dependencies (jQuery, jQuery UI, Underscore, Backbone, VIE, the editor of your choice)
* Include the Create JavaScript file (see `examples/create.js` and `examples/create-min.js`)
* Implement [Backbone.sync](http://documentcloud.github.com/backbone/#Sync) for your back-end

[Blogsiple](https://github.com/bergie/blogsiple) is a [Node.js](http://nodejs.org/) based CMS integration testbed for Create. It may provide useful examples on how the connection between Create and a REST-capable web tool works.
