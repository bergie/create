//     Create.js - On-site web editing interface
//     (c) 2012 IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  jQuery.widget('Midgard.midgardTags', {
    enhanced: false,

    options: {
      vie: null,
      entity: null,
      element: null,
      entityElement: null,
      parentElement: '.create-ui-tool-metadataarea',
      predicate: 'skos:related'
    },

    // Convert to reference URI as needed
    _normalizeSubject: function(subject) {
      if (this.entity.isReference(subject)) {
        return subject;
      }
        
      if (subject.substr(0, 7) !== 'http://') {
        subject = 'urn:tag:' + subject;
      }

      return subject;
    },

    // Centralized method for adding new tags to an entity
    // regardless of whether they come from this widget
    // or Annotate.js
    addTag: function (subject, label, type) {
      if (label === undefined) {
        label = subject;
      }

      subject = this._normalizeSubject(subject);

      var tagEntity = this.vie.entities.addOrUpdate({
        '@subject': subject,
        'rdfs:label': label,
        '@type': type
      });
      var tags = this.options.entity.get(this.options.predicate);
      if (!tags) {
        tags = new this.vie.Collection();
        this.options.entity.set(this.options.predicate, tags);
      }

      tags.addOrUpdate(tagEntity);
    },

    removeTag: function (subject) {
      var tags = this.options.entity.get(this.options.predicate);
      if (!tags) {
        return;
      }

      var tag = tags.get(subject);
      if (!tag) {
        return;
      }

      tags.remove(this._normalizeSubject(subject));
    },

    // Listen for accepted annotations from Annotate.js if that 
    // is in use
    // and register them as tags
    _listenAnnotate: function () {
      var widget = this;

      widget.element.bind('annotateselect', function (event, data) {
        widget.addTag(data.linkedEntity.uri, data.linkedEntity.label, data.linkedEntity.type[0]);
      });

      widget.element.bind('annotateremove', function (event, data) {
        widget.removeTag(data.linkedEntity.uri);
      });
    },

    _init: function () {
      var widget = this;
      this.vie = this.options.vie;
      this.entity = this.options.entity;
      this.element = this.options.element;

      jQuery(this.options.entityElement).bind('midgardeditableactivated', function (event, data) {
        if (data.instance !== widget.options.entity) {
          return;
        }
        widget._renderWidget();
        widget.loadTags();
      });

      jQuery(this.options.entityElement).bind('midgardeditablechanged', function (event, data) {
        if (data.instance !== widget.options.entity) {
          return;
        }
        widget.enhanced = false;
      });
    },

    _prepareEditor: function (button) {
      var contentArea = jQuery('<div class="create-ui-tags"></div>');
      var articleTags = jQuery('<div class="articleTags"><h3>Article tags</h3><input type="text" class="tags" value="" /></div>');
      var suggestedTags = jQuery('<div class="suggestedTags"><h3>Suggested tags</h3><input type="text" class="tags" value="" /></div>');

      // Tags plugin requires IDs to exist
      jQuery('input', articleTags).attr('id', 'articleTags-' + this.entity.cid);
      jQuery('input', suggestedTags).attr('id', 'suggestedTags-' + this.entity.cid);

      contentArea.append(articleTags);
      contentArea.append(suggestedTags);
      contentArea.hide();

      var offset = button.position();
      contentArea.css('position', 'absolute');
      contentArea.css('left', offset.left);
      contentArea.css('top', offset.top);

      return contentArea;
    },

    _renderWidget: function () {
      var widget = this;
      var subject = this.entity.getSubject();

      var button = jQuery('<button class="create-ui-btn"><i class="icon-tags"></i> Tags</a>').button();

      var parentElement = jQuery(this.options.parentElement);
      parentElement.empty();
      parentElement.append(button);
      parentElement.show();

      var contentArea = this._prepareEditor(button);
      button.after(contentArea);

      this.articleTags = jQuery('.articleTags input', contentArea).tagsInput({
        width: 'auto',
        height: 'auto',
        label: this.tagLabel,
        onAddTag: function (tag) {
          widget.addTag(tag);
        },
        onRemoveTag: function (tag) {
          widget.removeTag(tag);
        }
      });

      this.suggestedTags = jQuery('.suggestedTags input', contentArea).tagsInput({
        width: 'auto',
        height: 'auto',
        interactive: false,
        label: this.tagLabel,
        remove: false
      });

      button.bind('click', function() {
        contentArea.toggle();
      });
    },

    loadTags: function () {
      var widget = this;

      // Populate existing tags from entity
      var tags = this.entity.get(this.options.predicate);
      if (tags) {
        tags.each(function (tag) {
          widget.articleTags.addTag(tag.getSubject());
        });
      }

      if (this.vie.services.stanbol) {
        widget.enhance();
      }
    },

    _addEnhancement: function (enhancement) {
      if (enhancement.isEntity) {
        this.suggestedTags.addTag(enhancement.getSubject());
        return;
      }

      if (enhancement['http://www.w3.org/2000/01/rdf-schema#label>']) {
        this.suggestedTags.addTag(e['@subject']);
      }
    },

    enhance: function () {
      if (this.enhanced) {
        return;
      }
      this.enhanced = true;

      var widget = this;

      // load suggested tags
      this.vie.analyze({
        element: jQuery('[property]', this.options.entityElement)
      }).using(['stanbol']).execute().success(function (enhancements) {
        _.each(enhancements, function (enhancement) {
          widget._addEnhancement(enhancement);
        });
      }).fail(function (xhr) {
        // console.log(xhr);
      });
    },

    tagLabel: function (value) {
      if (value.substring(0, 9) == '<urn:tag:') {
        value = value.substring(9, value.length - 1);
      }

      if (value.substring(0, 8) == '<http://') {
        value = value.substring(value.lastIndexOf('/') + 1, value.length - 1);
        value = value.replace(/_/g, ' ');
      }

      return value;
    }
  });
})(jQuery);
