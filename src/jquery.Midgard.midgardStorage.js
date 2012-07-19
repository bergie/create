//     Create.js - On-site web editing interface
//     (c) 2011-2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
(function (jQuery, undefined) {
  jQuery.widget('Midgard.midgardStorage', {
    changedModels: [],
    saveEnabled: true,
    options: {
      // Whether to use localstorage
      localStorage: false,
      removeLocalstorageOnIgnore: true,
      // VIE instance to use for storage handling
      vie: null,
      // URL callback for Backbone.sync
      url: '',
      // Whether to enable automatic saving
      autoSave: false,
      // How often to autosave in milliseconds
      autoSaveInterval: 5000,
      // Whether to save entities that are referenced by entities
      // we're saving to the server.
      saveReferencedNew: false,
      saveReferencedChanged: false
    },

    _create: function () {
      var widget = this;

      if (Modernizr.localstorage) {
        this.options.localStorage = true;
      }

      this.vie = this.options.vie;

      this.vie.entities.bind('add', function (model) {
        // Add the back-end URL used by Backbone.sync
        model.url = widget.options.url;
        model.toJSON = model.toJSONLD;
      });

      jQuery('#midgardcreate-save').click(function () {
        widget._saveRemote({
          success: function () {
            jQuery('#midgardcreate-save').button({
              disabled: true
            });
          },
          error: function () {}
        });
      });

      widget._bindEditables();
      if (widget.options.autoSave) {
        widget._autoSave();
      }
    },

    _autoSave: function () {
      var widget = this;
      widget.saveEnabled = true;

      var doAutoSave = function () {
        if (!widget.saveEnabled) {
          return;
        }

        if (widget.changedModels.length === 0) {
          return;
        }

        widget._saveRemote({
          success: function () {
            jQuery('#midgardcreate-save').button({
              disabled: true
            });
          },
          error: function () {}
        });
      };

      var timeout = window.setInterval(doAutoSave, widget.options.autoSaveInterval);

      this.element.bind('startPreventSave', function () {
        if (timeout) {
          window.clearInterval(timeout);
          timeout = null;
        }
        widget.disableSave();
      });
      this.element.bind('stopPreventSave', function () {
        if (!timeout) {
          timeout = window.setInterval(doAutoSave, widget.options.autoSaveInterval);
        }
        widget.enableSave();
      });

    },

    enableSave: function () {
      this.saveEnabled = true;
    },

    disableSave: function () {
      this.saveEnabled = false;
    },

    _bindEditables: function () {
      var widget = this;
      var restorables = [];
      var restorer;

      widget.element.bind('midgardeditablechanged', function (event, options) {
        if (_.indexOf(widget.changedModels, options.instance) === -1) {
          widget.changedModels.push(options.instance);
        }
        widget._saveLocal(options.instance);
        jQuery('#midgardcreate-save').button({disabled: false});
      });

      widget.element.bind('midgardeditabledisable', function (event, options) {
        widget._restoreLocal(options.instance);
        jQuery('#midgardcreate-save').hide();
      });

      widget.element.bind('midgardeditableenable', function (event, options) {
        jQuery('#midgardcreate-save').button({disabled: true});
        jQuery('#midgardcreate-save').show();

        if (!options.instance._originalAttributes) {
          options.instance._originalAttributes = _.clone(options.instance.attributes);
        }

        if (!options.instance.isNew() && widget._checkLocal(options.instance)) {
          // We have locally-stored modifications, user needs to be asked
          restorables.push(options.instance);
        }

        /*_.each(options.instance.attributes, function (attributeValue, property) {
          if (attributeValue instanceof widget.vie.Collection) {
            widget._readLocalReferences(options.instance, property, attributeValue);
          }
        });*/
      });

      widget.element.bind('midgardcreatestatechange', function (event, options) {
        if (options.state === 'browse' || restorables.length === 0) {
          restorables = [];
          if (restorer) {
            restorer.close();
          }
          return;
        }
        
        restorer = jQuery('body').data('midgardCreate').showNotification({
          bindTo: '#midgardcreate-edit a',
          gravity: 'TR',
          body: restorables.length + " items on this page have local modifications",
          timeout: 0,
          actions: [
            {
              name: 'restore',
              label: 'Restore',
              cb: function() {
                _.each(restorables, function (instance) {
                  widget._readLocal(instance);
                });
                restorables = [];
                restorer = null;
              },
              className: 'create-ui-btn'
            },
            {
              name: 'ignore',
              label: 'Ignore',
              cb: function(event, notification) {
                if (widget.options.removeLocalstorageOnIgnore) {
                  _.each(restorables, function (instance) {
                    widget._removeLocal(instance);
                  });
                }
                notification.close();
                restorables = [];
                restorer = null;
              },
              className: 'create-ui-btn'
            }
          ]
        });
      });

      widget.element.bind('midgardstorageloaded', function (event, options) {
        if (_.indexOf(widget.changedModels, options.instance) === -1) {
          widget.changedModels.push(options.instance);
        }
        jQuery('#midgardcreate-save').button({
          disabled: false
        });
      });
    },

    _saveRemote: function (options) {
      var widget = this;
      if (widget.changedModels.length === 0) {
        return;
      }

      widget._trigger('save', null, {
        models: widget.changedModels
      });

      var needed = widget.changedModels.length;
      if (needed > 1) {
        notification_msg = needed + ' objects saved successfully';
      } else {
        subject = widget.changedModels[0].getSubjectUri();
        notification_msg = 'Object with subject ' + subject + ' saved successfully';
      }

      widget.disableSave();
      _.forEach(widget.changedModels, function (model, index) {

        // Optionally handle entities referenced in this model first
        _.each(model.attributes, function (value, property) {
          if (!value || !value.isCollection) {
            return;
          }

          value.each(function (referencedModel) {
            if (widget.changedModels.indexOf(referencedModel) !== -1) {
              // The referenced model is already in the save queue
              return;
            }

            if (referencedModel.isNew() && widget.options.saveReferencedNew) {
              return referencedModel.save();
            }

            if (referencedModel.hasChanged() && widget.options.saveReferencedChanged) {
              return referencedModel.save();
            }
          });
        });

        model.save(null, {
          success: function () {
            // From now on we're going with the values we have on server
            model._originalAttributes = _.clone(model.attributes);

            widget._removeLocal(model);
            widget.changedModels.splice(index, 1);
            needed--;
            if (needed <= 0) {
              // All models were happily saved
              widget._trigger('saved', null, {});
              options.success();
              jQuery('body').data('midgardCreate').showNotification({
                body: notification_msg
              });
              widget.enableSave();
            }
          },
          error: function (m, err) {
            notification_msg = 'Error occurred while saving';
            if (err.responseText) {
              notification_msg = notification_msg + ':<br />' + err.responseText;
            }

            options.error();
            jQuery('body').data('midgardCreate').showNotification({
              body: notification_msg
            });

            widget._trigger('error', null, {
              instance: model
            });
          }
        });
      });
    },

    _saveLocal: function (model) {
      if (!this.options.localStorage) {
        return;
      }

      if (model.isNew()) {
        // Anonymous object, save as refs instead
        if (!model.primaryCollection) {
          return;
        }
        return this._saveLocalReferences(model.primaryCollection.subject, model.primaryCollection.predicate, model);
      }
      localStorage.setItem(model.getSubjectUri(), JSON.stringify(model.toJSONLD()));
    },

    _getReferenceId: function (model, property) {
      return model.id + ':' + property;
    },

    _saveLocalReferences: function (subject, predicate, model) {
      if (!this.options.localStorage) {
        return;
      }

      if (!subject || !predicate) {
        return;
      }

      var widget = this;
      var identifier = subject + ':' + predicate;
      var json = model.toJSONLD();
      if (localStorage.getItem(identifier)) {
        var referenceList = JSON.parse(localStorage.getItem(identifier));
        var index = _.pluck(referenceList, '@').indexOf(json['@']);
        if (index !== -1) {
          referenceList[index] = json;
        } else {
          referenceList.push(json);
        }
        localStorage.setItem(identifier, JSON.stringify(referenceList));
        return;
      }
      localStorage.setItem(identifier, JSON.stringify([json]));
    },

    _checkLocal: function (model) {
      if (!this.options.localStorage) {
        return false;
      }

      var local = localStorage.getItem(model.getSubjectUri());
      if (!local) {
        return false;
      }

      return true;
    },

    _readLocal: function (model) {
      if (!this.options.localStorage) {
        return;
      }

      var local = localStorage.getItem(model.getSubjectUri());
      if (!local) {
        return;
      }
      if (!model._originalAttributes) {
        model._originalAttributes = _.clone(model.attributes);
      }
      var parsed = JSON.parse(local);
      var entity = this.vie.entities.addOrUpdate(parsed, {
        overrideAttributes: true
      });

      this._trigger('loaded', null, {
        instance: entity
      });
    },

    _readLocalReferences: function (model, property, collection) {
      if (!this.options.localStorage) {
        return;
      }

      var identifier = this._getReferenceId(model, property);
      var local = localStorage.getItem(identifier);
      if (!local) {
        return;
      }
      collection.add(JSON.parse(local));
    },

    _restoreLocal: function (model) {
      var widget = this;

      // Remove unsaved collection members
      if (!model) { return; }
      _.each(model.attributes, function (attributeValue, property) {
        if (attributeValue instanceof widget.vie.Collection) {
          attributeValue.forEach(function (model) {
            if (model.isNew()) {
              attributeValue.remove(model);
            }
          });
        }
      });

      // Restore original object properties
      if (jQuery.isEmptyObject(model.changedAttributes())) {
        if (model._originalAttributes) {
          model.set(model._originalAttributes);
        }
        return;
      }

      model.set(model.previousAttributes());
    },

    _removeLocal: function (model) {
      if (!this.options.localStorage) {
        return;
      }

      localStorage.removeItem(model.getSubjectUri());
    }
  });
})(jQuery);
