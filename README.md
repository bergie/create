Create - On-site web editing interface [![Build Status](https://secure.travis-ci.org/bergie/create.png)](http://travis-ci.org/bergie/create)
======================================

![Create logo](https://github.com/bergie/create/raw/master/design/create.png)

Create, from the [Midgard Project](http://www.midgard-project.org/), is a comprehensive web editing interface for Content Management Systems. It is designed to provide a modern, fully browser-based HTML5 environment for managing content. Create can be adapted to work on almost any content management backend.

![Midgard Create user interface, in March 2011](http://bergie.iki.fi/files/1e045994d03c25e459911e0ab235550c1aac901c901_midgardcreate-enter-edit-state-small.png) ![Midgard Create user interface, in March 2011](http://bergie.iki.fi/files/1e04599abfee694459911e0bf1021b4fddbed1bed1b_midgardcreate-save-transition-small.png)

Create.js is built on top of [VIE](http://viejs.org), the semantic interaction library powered by Backbone.js. The widgets in Create.js itself are done with the jQuery UI tools.

[![Cross-browser testing status](https://saucelabs.com/browser-matrix/create-js.svg)](https://saucelabs.com/u/create-js)

## Features

* Making RDFa-annotated content on pages editable
* Managing collections of content (add, remove)
* Local, in-browser storage and retrieval of unsaved content
* Adaptable connector for communicating with the back-end system
* Running workflows (approval, etc.) for content items
* Browsing and reverting content history
* Easy rebranding of the interface with some CSS
* Can be used as-is, or as a toolkit for a custom CMS UI

## Integrating Create with your CMS

Please refer to the [Create.js Integration Guide](http://createjs.org/guide/).

PHP developers should also check out [CreatePHP](https://github.com/flack/createphp). For easier Node.js integration there is [contentblocks](https://github.com/primaryobjects/contentblocks).

## Future plans

* Adopt the [Web Intents](http://webintents.org/) specification for better image and link handling
* Content annotation and auto-tagging with [Apache Stanbol](http://incubator.apache.org/stanbol/)
* Wrapper for using Create inside [Google Web Toolkit](http://code.google.com/webtoolkit/) via [VIE-GWT](https://github.com/alkacon/vie-gwt)

## Dependencies

* [Hallo](http://bergie.github.com/hallo/) - distraction-free content editor (optionally, [Aloha Editor](http://aloha-editor.org/) or [Redactor](http://redactorjs.com/))
* [VIE](https://github.com/bergie/vie) - editable RDFa library
* [Backbone.js](http://documentcloud.github.com/backbone/) - client-side management of models, views, and collections
* [jQuery UI](http://jqueryui.com/) - widget and effect library
* [Mousetrap](http://craig.is/killing/mice) - keyboard shortcuts library (optional)

## Building Create

Create.js uses a build system running on [Node.js](http://nodejs.org/), so you'll need that. Install the build dependencies with:

    $ npm install

Use the supplied `Gruntfile.coffee` to generate the merged JavaScript file for Create:

    $ grunt build

You can also generate a simplified version that only includes the inline editing features:

    $ grunt editonly

Note: the `grunt` command is part of the [Grunt](http://gruntjs.com) package. You can either run it from `./node_modules/.bin/grunt` or install it globally via `npm install -g grunt-cli`.

## Read more

* [Introducing the Midgard Create user interface](http://bergie.iki.fi/blog/introducing_the_midgard_create_user_interface/)
* [Using RDFa to make a web page editable](http://bergie.iki.fi/blog/using_rdfa_to_make_a_web_page_editable/)
* [Midgard Create and VIE presentation in the Aloha Editor conference](http://bergie.iki.fi/blog/midgard_create_and_vie_in_the_aloha_editor_conference/)

## Discussion

* [Create.js Google Groups mailing list](http://groups.google.com/group/createjs)
* [`#iks` IRC channel on Freenode](irc://irc.freenode.net/iks)

## Similar projects

* [Etch](http://etchjs.com/)

## Editor alternatives

The default rich text editor shipping with Create is [Hallo](http://hallojs.org/), an MIT-licensed editing widget.

You can also use other editor options under their own licensing schemes, or integrate something else.

### Using Aloha Editor

By default, Create uses the [Hallo Editor](http://bergie.github.com/hallo/). To use Create with [Aloha Editor](http://aloha-editor.org/) you need to:

* [Download the latest version of Aloha Editor](http://aloha-editor.org/builds/development/latest.zip)
* Extract the archive file and move the `aloha` directory into the `create/deps` folder -- check to have it like this: `create/deps/aloha/lib/aloha.js`
* For more information about using Aloha Editor see the [Aloha Editor Guides](http://aloha-editor.org/builds/development/latest/doc/guides/output/)

Using Aloha Editor with Create is covered by Aloha's FOSS License Exception:

> Aloha Editor’s Free and Open Source Software ("FOSS") License Exception allows developers of FOSS applications to include Aloha Editor with their FOSS applications. Aloha Editor is typically licensed pursuant to version 3 of the General Afero Public License ("AGPLv3"), but this exception permits distribution of Aloha Editor with a developer’s FOSS applications licensed under the terms of another FOSS license listed below [MIT license is included], even though such other FOSS license may be incompatible with the AGPLv3.

### Using Redactor

You need to acquire a [Redactor license](http://redactorjs.com/license/) and include the editor JavaScript and CSS files into your pages separately. Then you can set Create to use Redactor for particular areas by using the `redactorWidget` editor option.

## Translations

The whole Create.js user interface can be translated to different languages.

To contribute a translation, copy the [English localization file](https://github.com/bergie/create/blob/master/locale/en.js) and replace the values there with your language. Then send the file via a pull request.

Changes to strings used by Create.js will be announced on the [mailing list](http://groups.google.com/group/createjs), so it is a good idea to subscribe to it if you make translations.

### Running Unit Tests in browser

Direct your browser to the `test/index.html` file to run Create's [QUnit](http://docs.jquery.com/Qunit) tests.

#### Headless unit tests on PhantomJS

PhantomJS test automation is part of the project's build configuration:

    $ grunt test

or:

    $ npm test

#### Continuous integration

Create uses [Travis](http://travis-ci.org/) for continuous integration. Simply add your fork there and every time you push you'll get the tests run. See [our Travis build page](http://travis-ci.org/#!/bergie/create) for more information.


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/bergie/create/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

