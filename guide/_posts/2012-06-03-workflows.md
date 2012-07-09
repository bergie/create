---
layout: document
title: Workflows widget
name: workflows
source: "https://github.com/bergie/create/blob/master/src/jquery.Midgard.midgardWorkflows.js"
---
The `Midgard.midgardWorkflows` widget provides a way to see current workflow status of the currently activated content item, and initiate new workflows for it.

The Workflows widget will be automatically initiated by Create.js. You can also run it standalone:

    jQuery('body').midgardWorkflows({
      url: function (item) { return '/some/item/workflows.json'; }
    });

## Configuration

* `url`: The URL callback function used for retrieving workflows for an item

## Events

* `midgardworkflowschanged`: triggered whenever workflows have been retrieved for an item. Event data contains the content item and the available workflows
