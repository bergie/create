---
layout: document
title: Notifications widget
name: notifications
source: "https://github.com/bergie/create/blob/master/src/jquery.Midgard.midgardNotifications.js"
---
The `Midgard.midgardNotifications` widget provides a way to display notifications on various events to the user. These notifications may optionally provide buttons that the user can act on.

When initialized, the notifications widget will instantiate a `div` element for containing any notifications being displayed.

The notifications widget will be instantiated by the Create widget automatically. If you want to use it standalone, simply call:

    jQuery('body').midgardNotifications();

## Displaying notifications

When the notifications widget is instantiated to an element, it will set a `data` attribute `midgardNotifications` pointing to itself.

This allows new notifications to be shown using the following call:

    jQuery('body').data('midgardNotifications').create({
      body: 'Hello, world!'
    });

The `create` method accepts various properties to affect the behavior of a notification pop-up. These include:

* `body`: Textual contents of the notification
* `class_prefix`: Prefix for the CSS classes of the notification element
* `auto_show`: whether the notification should be displayed automatically
* `bindTo`: a CSS selector to bind the notification into a particular DOM element instead of the notifications area
* `gravity`: the direction from the notification to the bound element. For example `TR` for top-right
* `timeout`: how many milliseconds the notification should be shown, or `0` for forever
* `actions`: array of action buttons to be added to the notification
