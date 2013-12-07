/*
//     Create.js - On-site web editing interface
//     (c) 2011-2012 Henri Bergius, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://createjs.org/
*/
(function (jQuery, undefined) {
  // Run JavaScript in strict mode
  /*global jQuery:false _:false window:false */
  'use strict';

  jQuery.widget('Midgard.midgardStorage', {
    saveEnabled: true,
    options: {
      // Whether to use localstorage
      localStorage: false,
      // String prefix for localStorage identifiers
      storagePrefix: '',
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
      saveReferencedChanged: false,
      // Namespace used for events from midgardEditable-derived widget
      editableNs: 'midgardeditable',
      // CSS selector for the Edit button, leave to null to not bind
      // notifications to any element
      editSelector: '#midgardcreate-edit a',
      localize: function (id, language) {
        return window.midgardCreate.localize(id, language);
      },
      language: null
    },

    _create: function () {
      var widget = this;
      this.changedModels = [];

      if (window.localStorage) {
        this.options.localStorage = true;
      }

      this.vie = this.options.vie;

      this.vie.entities.on('add', function (model) {
        // Add the back-end URL used by Backbone.sync
        model.url = widget.options.url;
        model.toJSON = model.toJSONLD;
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

        widget.saveRemoteAll({
          // We make autosaves silent so that potential changes from server
          // don't disrupt user while writing.
          silent: true
        });
      };

      var timeout = window.setInterval(doAutoSave, widget.options.autoSaveInterval);

      this.element.on('startPreventSave', function () {
        if (timeout) {
          window.clearInterval(timeout);
          timeout = null;
        }
        widget.disableAutoSave();
      });
      this.element.on('stopPreventSave', function () {
        if (!timeout) {
          timeout = window.setInterval(doAutoSave, widget.options.autoSaveInterval);
        }
        widget.enableAutoSave();
      });

    },

    enableAutoSave: function () {
      this.saveEnabled = true;
    },

    disableAutoSave: function () {
      this.saveEnabled = false;
    },

    _bindEditables: function () {
      var widget = this;
      this.restorables = [];
      var restorer;

      widget.element.on(widget.options.editableNs + 'changed', function (event, options) {
        if (_.indexOf(widget.changedModels, options.instance) === -1) {
          widget.changedModels.push(options.instance);
          options.instance.midgardStorageVersion = 1;
        } else {
          options.instance.midgardStorageVersion++;
        }
        widget._saveLocal(options.instance);
      });

      widget.element.on(widget.options.editableNs + 'disable', function (event, options) {
        widget.revertChanges(options.instance);
      });

      widget.element.on(widget.options.editableNs + 'enable', function (event, options) {
        if (!options.instance._originalAttributes) {
          options.instance._originalAttributes = _.clone(options.instance.attributes);
        }

        if (!options.instance.isNew() && widget._checkLocal(options.instance)) {
          // We have locally-stored modifications, user needs to be asked
          widget.restorables.push(options.instance);
        }

        /*_.each(options.instance.attributes, function (attributeValue, property) {
          if (attributeValue instanceof widget.vie.Collection) {
            widget._readLocalReferences(options.instance, property, attributeValue);
          }
        });*/
      });

      widget.element.on('midgardcreatestatechange', function (event, options) {
        if (options.state === 'browse' || widget.restorables.length === 0) {
          widget.restorables = [];
          if (restorer) {
            restorer.close();
          }
          return;
        }
        restorer = widget.checkRestore();
      });

      widget.element.on('midgardstorageloaded', function (event, options) {
        if (_.indexOf(widget.changedModels, options.instance) === -1) {
          widget.changedModels.push(options.instance);
        }
      });
    },

    checkRestore: function () {
      var widget = this;
      if (widget.restorables.length === 0) {
        return;
      }

      var message;
      var restorer;
      if (widget.restorables.length === 1) {
        message = _.template(widget.options.localize('localModification', widget.options.language), {
          label: widget.restorables[0].getSubjectUri()
        });
      } else {
        message = _.template(widget.options.localize('localModifications', widget.options.language), {
          number: widget.restorables.length
        });
      }

      var doRestore = function (event, notification) {
        widget.restoreLocalAll();
        restorer.close();
      };

      var doIgnore = function (event, notification) {
        widget.ignoreLocal();
        restorer.close();
      };

      restorer = jQuery('body').midgardNotifications('create', {
        bindTo: widget.options.editSelector,
        gravity: 'TR',
        body: message,
        timeout: 0,
        actions: [
          {
            name: 'restore',
            label: widget.options.localize('Restore', widget.options.language),
            cb: doRestore,
            className: 'create-ui-btn'
          },
          {
            name: 'ignore',
            label: widget.options.localize('Ignore', widget.options.language),
            cb: doIgnore,
            className: 'create-ui-btn'
          }
        ],
        callbacks: {
          beforeShow: function () {
            if (!window.Mousetrap) {
              return;
            }
            window.Mousetrap.bind(['command+shift+r', 'ctrl+shift+r'], function (event) {
              event.preventDefault();
              doRestore();
            });
            window.Mousetrap.bind(['command+shift+i', 'ctrl+shift+i'], function (event) {
              event.preventDefault();
              doIgnore();
            });
          },
          afterClose: function () {
            if (!window.Mousetrap) {
              return;
            }
            window.Mousetrap.unbind(['command+shift+r', 'ctrl+shift+r']);
            window.Mousetrap.unbind(['command+shift+i', 'ctrl+shift+i']);
          }
        }
      });
      return restorer;
    },

    restoreLocalAll: function () {
      _.each(this.restorables, function (instance) {
        this.readLocal(instance);
      }, this);
      this.restorables = [];
    },

    ignoreLocal: function () {
      if (this.options.removeLocalstorageOnIgnore) {
        _.each(this.restorables, function (instance) {
          this._removeLocal(instance);
        }, this);
      }
      this.restorables = [];
    },

    saveReferences: function (model) {
      _.each(model.attributes, function (value, property) {
        if (!value || !value.isCollection) {
          return;
        }

        value.each(function (referencedModel) {
          if (this.changedModels.indexOf(referencedModel) !== -1) {
            // The referenced model is already in the save queue
            return;
          }

          if (referencedModel.isNew() && this.options.saveReferencedNew) {
            return referencedModel.save();
          }

          if (referencedModel.hasChanged() && this.options.saveReferencedChanged) {
            return referencedModel.save();
          }
        }, this);
      }, this);
    },

    saveRemote: function (model, options) {
      // Optionally handle entities referenced in this model first
      this.saveReferences(model);

      this._trigger('saveentity', null, {
        entity: model,
        options: options
      });

      var widget = this,
          previousVersion = model.midgardStorageVersion;
      model.save(null, _.extend({}, options, {
        success: function (m, response) {
          // From now on we're going with the values we have on server
          model._originalAttributes = _.clone(model.attributes);
          widget._removeLocal(model);
          window.setTimeout(function () {
            // Remove the model from the list of changed models after saving if no other change was made to the model
            if (model.midgardStorageVersion == previousVersion) {
              widget.changedModels.splice(widget.changedModels.indexOf(model), 1);
            }
          }, 0);
          if (_.isFunction(options.success)) {
            options.success(m, response);
          }
          widget._trigger('savedentity', null, {
            entity: model,
            options: options
          });
        },
        error: function (m, response) {
          if (_.isFunction(options.error)) {
            options.error(m, response);
          }
        }
      }));
    },

    saveRemoteAll: function (options) {
      var widget = this;
      if (widget.changedModels.length === 0) {
        return;
      }

      widget._trigger('save', null, {
        entities: widget.changedModels,
        options: options,
        // Deprecated
        models: widget.changedModels
      });

      var notification_msg;
      var needed = widget.changedModels.length;
      if (needed > 1) {
        notification_msg = _.template(widget.options.localize('saveSuccessMultiple', widget.options.language), {
          number: needed
        });
      } else {
        notification_msg = _.template(widget.options.localize('saveSuccess', widget.options.language), {
          label: widget.changedModels[0].getSubjectUri()
        });
      }

      widget.disableAutoSave();
      _.each(widget.changedModels, function (model) {
        this.saveRemote(model, {
          success: function (m, response) {
            needed--;
            if (needed <= 0) {
              // All models were happily saved
              widget._trigger('saved', null, {
                options: options
              });
              if (options && _.isFunction(options.success)) {
                options.success(m, response);
              }
              jQuery('body').midgardNotifications('create', {
                body: notification_msg
              });
              widget.enableAutoSave();
            }
          },
          error: function (m, err) {
            if (options && _.isFunction(options.error)) {
              options.error(m, err);
            }
            jQuery('body').midgardNotifications('create', {
              body: _.template(widget.options.localize('saveError', widget.options.language), {
                error: err.responseText || ''
              }),
              timeout: 0
            });

            widget._trigger('error', null, {
              instance: model
            });
          }
        });
      }, this);
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
      var key = this.options.storagePrefix + model.getSubjectUri();
      window.localStorage.setItem(key, JSON.stringify(model.toJSONLD()));
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
      var identifier = this.options.storagePrefix + subject + ':' + predicate;
      var json = model.toJSONLD();
      if (window.localStorage.getItem(identifier)) {
        var referenceList = JSON.parse(window.localStorage.getItem(identifier));
        var index = _.pluck(referenceList, '@').indexOf(json['@']);
        if (index !== -1) {
          referenceList[index] = json;
        } else {
          referenceList.push(json);
        }
        window.localStorage.setItem(identifier, JSON.stringify(referenceList));
        return;
      }
      window.localStorage.setItem(identifier, JSON.stringify([json]));
    },

    _checkLocal: function (model) {
      if (!this.options.localStorage) {
        return false;
      }

      var key = this.options.storagePrefix + model.getSubjectUri();
      var local = window.localStorage.getItem(key);
      if (!local) {
        return false;
      }

      return true;
    },

    hasLocal: function (model) {
      if (!this.options.localStorage) {
        return false;
      }
      var key = this.options.storagePrefix + model.getSubjectUri();
      if (!window.localStorage.getItem(key)) {
        return false;
      }
      return true;
    },

    readLocal: function (model) {
      if (!this.options.localStorage) {
        return;
      }

      var key = this.options.storagePrefix + model.getSubjectUri();
      var local = window.localStorage.getItem(key);
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

      var identifier = this.options.storagePrefix + this._getReferenceId(model, property);
      var local = window.localStorage.getItem(identifier);
      if (!local) {
        return;
      }
      collection.add(JSON.parse(local));
    },

    revertChanges: function (model) {
      var widget = this;

      // Remove unsaved collection members
      if (!model) { return; }
      _.each(model.attributes, function (attributeValue, property) {
        if (attributeValue instanceof widget.vie.Collection) {
          var removables = [];
          attributeValue.forEach(function (model) {
            if (model.isNew()) {
              removables.push(model);
            }
          });
          attributeValue.remove(removables);
        }
      });

      // Restore original object properties
      if (!model.changedAttributes()) {
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
      var key = this.options.storagePrefix + model.getSubjectUri();
      window.localStorage.removeItem(key);
    }
  });
})(jQuery);
