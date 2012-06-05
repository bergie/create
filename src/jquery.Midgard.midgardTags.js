//     Create.js - On-site web editing interface
//     (c) 2012 IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  jQuery.widget('Midgard.midgardTags', {
    options: {
      vie: null,
      entity: null,
      element: null,
      entityElement: null
    },

    _init: function () {

      this.vie = this.options.vie;
      this.entity = this.options.entity;
      this.element = this.options.element;

      var subject = this.entity.getSubject();

      // insert settings pane
      var id = subject.replace(/[^A-Za-z]/g, '-');
      this.pane = jQuery('<div class="hiddenfieldsContainer"><div class="hiddenfieldsToggle"></div><div class="hiddenfields"><div class="hiddenfieldsCloseButton"></div><h2>Article settings</h2><div id="articleTagsWrapper"><form><div class="articleTags"><h3>Article tags</h3><input type="text" id="' + id + '-articleTags" class="tags" value="" /></div><div class="articleSuggestedTags"><h3>Suggested tags</h3><input type="text" id="' + id + '-suggestedTags" class="tags" value="" /></div></form></div></div><div class="hiddenfieldsCloseCorner"></div></div>');
      this.pane = this.pane.insertBefore(this.element);
      this.articleTags = this.pane.find('.articleTags input');
      this.suggestedTags = this.pane.find('.articleSuggestedTags input');

      // bind toggle events for settings pane
      this.pane.find('.hiddenfieldsToggle').click(function (event) {
        var context = jQuery(this).closest('.hiddenfieldsContainer');
        jQuery('.hiddenfields', context).show();
        jQuery('.hiddenfieldsToggle', context).hide();
        jQuery('.hiddenfieldsCloseCorner', context).show();
        jQuery('.hiddenfieldsCloseButton', context).show();
      });

      var that = this;
      this.pane.find('.hiddenfieldsCloseCorner, .hiddenfieldsCloseButton').click(function (event) {
        that.closeTags();
      });

      jQuery(document).click(function (e) {
        if (jQuery(e.target).closest('.hiddenfieldsContainer').size() === 0 && jQuery('.hiddenfieldsCloseCorner:visible').length > 0) {
          that.closeTags();
        }
      });

      this.articleTags.tagsInput({
        width: 'auto',
        height: 'auto',
        onAddTag: function (tag) {

          var entity = that.entity;

          // convert to reference url
          if (!entity.isReference(tag)) {
            tag = 'urn:tag:' + tag;
          }

          // add tag to entity
          entity.attributes['<http://purl.org/dc/elements/1.1/subject>'].vie = that.vie;
          entity.attributes['<http://purl.org/dc/elements/1.1/subject>'].addOrUpdate({
            '@subject': tag
          });
        },
        onRemoveTag: function (tag) {

          // remove tag from entity
          that.entity.attributes['<http://purl.org/dc/elements/1.1/subject>'].remove(tag);
        },
        label: this.tagLabel
      });

      this.suggestedTags.tagsInput({
        width: 'auto',
        height: 'auto',
        interactive: false,
        label: this.tagLabel,
        remove: false
      });

      // add suggested tag on click to tags
      jQuery('#' + id + '-suggestedTags_tagsinput .tag span').live('click', function () {

        var tag = jQuery(this).text();
        that.articleTags.addTag(jQuery(this).data('value'));
        that.suggestedTags.removeTag($.trim(tag));

        return false;
      });

      this.loadTags();
    },

    closeTags: function () {
      var context = jQuery('.hiddenfieldsContainer');
      jQuery('.hiddenfields', context).hide();
      jQuery('.hiddenfieldsToggle', context).show();
      jQuery('.hiddenfieldsCloseCorner', context).hide();
      jQuery('.hiddenfieldsCloseButton', context).hide();

      // save on close
      this.options.deactivated();
    },

    loadTags: function () {

      var that = this;

      // load article tags
      var tags = this.entity.attributes['<http://purl.org/dc/elements/1.1/subject>'].models;
      jQuery(tags).each(function () {
        that.articleTags.addTag(this.id);
      });

      // load suggested tags
      that.vie.analyze({
        element: this.options.entityElement
      }).using(['stanbol']).execute().success(function (enhancements) {
        return jQuery(enhancements).each(function (i, e) {

          if (typeof e.attributes == 'undefined') {

            if (e['<http://www.w3.org/2000/01/rdf-schema#label>']) {
              that.suggestedTags.addTag(e['@subject']);
            }

          } else {

            // Backward compability
            if (e.attributes['<rdfschema:label>']) {
              that.suggestedTags.addTag(e.id);
            }
          }
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
