/*
//     Create.js - On-site web editing interface
//     (c) 2012 IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
*/
(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false */
  'use strict';

  jQuery.widget('Midgard.midgardTags', {
    enhanced: false,

    options: {
      predicate: 'skos:related',
      vie: null,
      templates: {
        tags: '<div class="create-ui-tags <%= type %>Tags"><h3><%= label %></h3><input type="text" class="tags" value="" /></div>'
      },
      localize: function (id, language) {
        return window.midgardCreate.localize(id, language);
      },
      language: null
    },

    _init: function () {
      this.vie = this.options.vie;
    },

    activate: function (data) {
      // An editable has been activated. Prepare the tag editor for the
      // entity
      var inputs = this._render(data.entity);
      this.loadTags(data.entity, data.predicate, inputs);
    },

    // Convert to reference URI as needed
    _normalizeSubject: function(subject) {
      if (this.vie.entities.isReference(subject)) {
        return subject;
      }
        
      if (subject.substr(0, 7) !== 'http://') {
        subject = 'urn:tag:' + subject;
      }

      subject = this.vie.entities.toReference(subject);
      return subject;
    },

    _tagLabel: function (subject) {
      subject = this.vie.entities.fromReference(subject);

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
    addTag: function (entity, subject, label, type) {
      if (label === undefined) {
        label = this._tagLabel(subject);
      }

      subject = this._normalizeSubject(subject);
      var tags = entity.get(this.options.predicate);
      if (tags && tags.isCollection && tags.get(subject)) {
        return;
      }

      if (type && !entity.isReference(type)) {
        type = entity.toReference(type);
      }

      var tagEntity = this.vie.entities.addOrUpdate({
        '@subject': subject,
        'rdfs:label': label,
        '@type': type
      });

      if (!tags) {
        entity.set(this.options.predicate, tagEntity);
        return;
      }
      tags.addOrUpdate(tagEntity);
    },

    removeTag: function (entity, subject) {
      var tags = entity.get(this.options.predicate);
      if (!tags) {
        return;
      }

      subject = this._normalizeSubject(subject);
      var tag = tags.get(subject);
      if (!tag) {
        return;
      }

      tags.remove(subject);
    },

    // Listen for accepted annotations from Annotate.js if that 
    // is in use and register them as tags
    _listenAnnotate: function (entity, entityElement) {
      var widget = this;
      entityElement.on('annotateselect', function (event, data) {
        widget.addTag(entity, data.linkedEntity.uri, data.linkedEntity.label, data.linkedEntity.type[0]);
      });

      entityElement.on('annotateremove', function (event, data) {
        widget.removeTag(entity, data.linkedEntity.uri);
      });
    },

    _render: function (entity) {
      this.element.empty();
      var articleTags = jQuery(_.template(this.options.templates.tags, {
        type: 'article',
        label: this.options.localize('Item tags', this.options.language)
      }));
      var suggestedTags = jQuery(_.template(this.options.templates.tags, {
        type: 'suggested',
        label: this.options.localize('Suggested tags', this.options.language)
      }));

      // Tags plugin requires IDs to exist
      jQuery('input', articleTags).attr('id', 'articleTags-' + entity.cid);
      jQuery('input', suggestedTags).attr('id', 'suggestedTags-' + entity.cid);

      this.element.append(articleTags);
      this.element.append(suggestedTags);

      this._renderInputs(entity, articleTags, suggestedTags);
      return {
        tags: articleTags,
        suggested: suggestedTags
      };
    },

    _renderInputs: function (entity, articleTags, suggestedTags) {
      var widget = this;
      var subject = entity.getSubject();

      articleTags.tagsInput({
        width: 'auto',
        height: 'auto',
        onAddTag: function (tag) {
          widget.addTag(entity, tag);
        },
        onRemoveTag: function (tag) {
          widget.removeTag(entity, tag);
        },
        defaultText: this.options.localize('add a tag', this.options.language)
      });

      var selectSuggested = function () {
        var tag = jQuery.trim(jQuery(this).text());
        widget.addTag(entity, tag);
        suggestedTags.removeTag(tag);
      };

      suggestedTags.tagsInput({
        width: 'auto',
        height: 'auto',
        interactive: false,
        onAddTag: function (tag) {
          jQuery('.tag span', suggestedTags).off('click', selectSuggested);
          jQuery('.tag span', suggestedTags).on('click', selectSuggested);
        },
        onRemoveTag: function (tag) {
          jQuery('.tag span', suggestedTags).off('click', selectSuggested);
          jQuery('.tag span', suggestedTags).on('click', selectSuggested);
        },
        remove: false
      });
    },

    _getTagStrings: function (tags) {
      var tagArray = [];

      if (_.isString(tags)) {
        tagArray.push(tags);
        return tagArray;
      }

      if (tags.isCollection) {
        tags.each(function (tag) {
          tagArray.push(tag.get('rdfs:label'));
        });
        return tagArray;
      }

      _.each(tags, function (tag) {
        tagArray.push(this._tagLabel(tag));
      }, this);
      return tagArray;
    },

    loadTags: function (entity, predicate, inputs) {
      var widget = this;

      // Populate existing tags from entity
      var tags = entity.get(this.options.predicate);
      if (tags) {
        var tagArray = this._getTagStrings(tags);
        _.each(tagArray, inputs.tags.addTag, inputs.tags);
      }

      if (this.vie.services.stanbol) {
        //widget.enhance();
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

    _addEnhancement: function (entity, enhancement) {
      if (!enhancement.isEntity) {
        return;
      }

      var label = this._getLabelLang(enhancement.get('rdfs:label'));
      if (!label) {
        return;
      }

      var tags = entity.get(this.options.predicate);
      if (tags && tags.isCollection && tags.indexOf(enhancement) !== -1) {
        return;
      }

      this.suggestedTags.addTag(label);
    },

    enhance: function (entity, entityElement) {
      if (this.enhanced) {
        return;
      }
      this.enhanced = true;

      var widget = this;

      // load suggested tags
      this.vie.analyze({
        element: jQuery('[property]', entityElement)
      }).using(['stanbol']).execute().success(function (enhancements) {
        _.each(enhancements, function (enhancement) {
          widget._addEnhancement(entity, enhancement);
        });
      }).fail(function (xhr) {
        // console.log(xhr);
      });
    }
  });
})(jQuery);
