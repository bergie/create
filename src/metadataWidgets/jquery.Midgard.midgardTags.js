//     Create.js - On-site web editing interface
//     (c) 2012 IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false */
  'use strict';

  jQuery.widget('Midgard.midgardTags', {
    enhanced: false,

    options: {
      vie: null,
      entity: null,
      element: null,
      entityElement: null,
      parentElement: '.create-ui-tool-metadataarea',
      predicate: 'skos:related',
      templates: {
        button: '<button class="create-ui-btn"><i class="icon-<%= icon %>"></i> <%= label %></button>',
        contentArea: '<div class="dropdown-menu"></div>',
        tags: '<div class="create-ui-tags <%= type %>Tags"><h3><%= label %></h3><input type="text" class="tags" value="" /></div>'
      },
      localize: function (id, language) {
        return window.midgardCreate.localize(id, language);
      },
      language: null
    },

    _init: function () {
      return;
      var widget = this;

      this.vie = this.options.vie;
      this.entity = this.options.entity;
      this.element = this.options.element;
      jQuery(this.options.entityElement).on('midgardeditableactivated', function (event, data) {
        if (data.instance !== widget.options.entity) {
          return;
        }
        widget._renderWidget();
        widget.loadTags();
      });

      jQuery(this.options.entityElement).on('midgardeditablechanged', function (event, data) {
        if (data.instance !== widget.options.entity) {
          return;
        }
        widget.enhanced = false;
      });

      this._listenAnnotate(this.options.entityElement);
    },

    activate: function (data) {
      console.log("ACTIVATING", data);
    },

    // Convert to reference URI as needed
    _normalizeSubject: function(subject) {
      if (this.entity.isReference(subject)) {
        return subject;
      }
        
      if (subject.substr(0, 7) !== 'http://') {
        subject = 'urn:tag:' + subject;
      }

      subject = this.entity.toReference(subject);
      return subject;
    },

    _tagLabel: function (subject) {
      subject = this.entity.fromReference(subject);

      if (subject.substr(0, 8) === 'urn:tag:') {
        subject = subject.substr(8, subject.length - 1);
      }

      if (subject.substring(0, 7) == 'http://') {
        subject = subject.substr(subject.lastIndexOf('/') + 1, subject.length - 1);
        subject = subject.replace(/_/g, ' ');
      }
      return subject;
    },

    // Centralized method for adding new tags to an entity
    // regardless of whether they come from this widget
    // or Annotate.js
    addTag: function (subject, label, type) {
      if (label === undefined) {
        label = this._tagLabel(subject);
      }

      subject = this._normalizeSubject(subject);

      if (type && !this.entity.isReference(type)) {
        type = this.entity.toReference(type);
      }

      var tagEntity = this.vie.entities.addOrUpdate({
        '@subject': subject,
        'rdfs:label': label,
        '@type': type
      });

      var tags = this.options.entity.get(this.options.predicate);
      if (!tags) {
        tags = new this.vie.Collection();
        tags.vie = this.options.vie;
        this.options.entity.set(this.options.predicate, tags);
      } else if (!tags.isCollection) {
        tags = new this.vie.Collection(_.map(tags, function(tag) {
          if (tag.isEntity) {
            return tag;
          }
          return {
            '@subject': tag
          };
        }));
        tags.vie = this.options.vie;
        this.options.entity.set(this.options.predicate, tags);
      }

      tags.addOrUpdate(tagEntity);

      this.options.entityElement.trigger('midgardeditablechanged', {
        instance: this.options.entity
      });
    },

    removeTag: function (subject) {
      var tags = this.options.entity.get(this.options.predicate);
      if (!tags) {
        return;
      }

      subject = this._normalizeSubject(subject);
      var tag = tags.get(subject);
      if (!tag) {
        return;
      }

      tags.remove(subject);
      this.options.entityElement.trigger('midgardeditablechanged', {
        instance: this.options.entity
      });
    },

    // Listen for accepted annotations from Annotate.js if that 
    // is in use
    // and register them as tags
    _listenAnnotate: function (entityElement) {
      var widget = this;
      entityElement.on('annotateselect', function (event, data) {
        widget.addTag(data.linkedEntity.uri, data.linkedEntity.label, data.linkedEntity.type[0]);
      });

      entityElement.on('annotateremove', function (event, data) {
        widget.removeTag(data.linkedEntity.uri);
      });
    },

    _prepareEditor: function (button) {
      var contentArea = jQuery(_.template(this.options.templates.contentArea, {}));
      var articleTags = jQuery(_.template(this.options.templates.tags, {
        type: 'article',
        label: this.options.localize('Item tags', this.options.language)
      }));
      var suggestedTags = jQuery(_.template(this.options.templates.tags, {
        type: 'suggested',
        label: this.options.localize('Suggested tags', this.options.language)
      }));

      // Tags plugin requires IDs to exist
      jQuery('input', articleTags).attr('id', 'articleTags-' + this.entity.cid);
      jQuery('input', suggestedTags).attr('id', 'suggestedTags-' + this.entity.cid);

      contentArea.append(articleTags);
      contentArea.append(suggestedTags);
      contentArea.hide();

      var offset = button.position();
      contentArea.css('position', 'absolute');
      contentArea.css('left', offset.left);

      return contentArea;
    },

    _renderWidget: function () {
      var widget = this;
      var subject = this.entity.getSubject();

      var button = jQuery(_.template(this.options.templates.button, {
        icon: 'tags',
        label: this.options.localize('Tags', this.options.language)
      }));

      var parentElement = jQuery(this.options.parentElement);
      parentElement.empty();
      parentElement.append(button);
      parentElement.show();

      var contentArea = this._prepareEditor(button);
      button.after(contentArea);

      this.articleTags = jQuery('.articleTags input', contentArea).tagsInput({
        width: 'auto',
        height: 'auto',
        onAddTag: function (tag) {
          widget.addTag(tag);
        },
        onRemoveTag: function (tag) {
          widget.removeTag(tag);
        },
        defaultText: this.options.localize('add a tag', this.options.language)
      });

      var selectSuggested = function () {
        var tag = jQuery.trim(jQuery(this).text());
        widget.articleTags.addTag(tag);
        widget.suggestedTags.removeTag(tag);
      };

      this.suggestedTags = jQuery('.suggestedTags input', contentArea).tagsInput({
        width: 'auto',
        height: 'auto',
        interactive: false,
        onAddTag: function (tag) {
          jQuery('.suggestedTags .tag span', contentArea).off('click', selectSuggested);
          jQuery('.suggestedTags .tag span', contentArea).on('click', selectSuggested);
        },
        onRemoveTag: function (tag) {
          jQuery('.suggestedTags .tag span', contentArea).off('click', selectSuggested);
          jQuery('.suggestedTags .tag span', contentArea).on('click', selectSuggested);
        },
        remove: false
      });

      button.on('click', function() {
        contentArea.toggle();
      });
    },

    loadTags: function () {
      var widget = this;

      // Populate existing tags from entity
      var tags = this.entity.get(this.options.predicate);
      if (tags) {
        if (_.isString(tags)) {
          widget.articleTags.addTag(widget._tagLabel(tags));
        } else if (tags.isCollection) {
          tags.each(function (tag) {
            widget.articleTags.addTag(tag.get('rdfs:label'));
          });
        } else {
          _.each(tags, function (tag) {
            widget.articleTags.addTag(widget._tagLabel(tag));
          });
        }
      }

      if (this.vie.services.stanbol) {
        widget.enhance();
      } else {
        jQuery('.suggestedTags', widget.element).hide();
      }
    },

    _getLabelLang: function (labels) {
      if (!_.isArray(labels)) {
        return null;
      }

      var langLabel;

      _.each(labels, function (label) {
        if (label['@language'] === 'en') {
          langLabel = label['@value'];
        }
      });

      return langLabel;
    },

    _addEnhancement: function (enhancement) {
      if (!enhancement.isEntity) {
        return;
      }

      var label = this._getLabelLang(enhancement.get('rdfs:label'));
      if (!label) {
        return;
      }

      var tags = this.options.entity.get(this.options.predicate);
      if (tags && tags.isCollection && tags.indexOf(enhancement) !== -1) {
        return;
      }

      this.suggestedTags.addTag(label);
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
    }
  });
})(jQuery);
