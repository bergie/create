/*
//     Create.js - On-site web editing interface
//     (c) 2012 Martin Holzhauer
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
*/
(function (jQuery, undefined) {
    /*global OpenLayers:false */
    // Run JavaScript in strict mode
    'use strict';

    // This widget allows editing geocoordinates with the help of openlayers
    // and per default layer OSM
    jQuery.widget('Midgard.midgardGeo', {
        options:{
            layer:null,
            map:null,
            coordSystem:'EPSG:4326',
            defaultCenter: null,
            defaultZoomLevel: 3,
            geoProperty: 'http://schema.org/geo',
            geoCoordinateType: 'http://schema.org/GeoCoordinates',
            geoLonProperty: 'http://schema.org/longitude',
            geoLatProperty: 'http://schema.org/latitude',
            marker: {
                url: 'http://www.openlayers.org/dev/img/marker.png',
                size: {w:21, h:25},
                offset: {w:-10, h:-25} //-(size.w / 2), -size.h
            }
        },
        data : {},
        coordsObj : null,

        /**
         * activate mapwidget
         *
         * @param data
         */
        activate: function (data) {
            this.data = data;
            this.coordsObj = null;

            var geo = this.data.entity.get(this.options.geoProperty);

            if(_.isUndefined(geo)) {
                var types = this.data.entity.attributes['@type'];
                if(!_.isArray(types)) {
                    types = [types];
                }

                if(_.indexOf(types, '<' + this.options.geoCoordinateType + '>') > 0) {
                    this.coordsObj = this.data.entity;
                }
            } else {
                this.coordsObj = geo.models[0];
            }

            if(_.isNull(this.coordsObj)){
                this.element.hide();
                return;
            } else {
                this.element.show();
            }


            var lat = parseFloat(this.coordsObj.get(this.options.geoLatProperty)),
                lon = parseFloat(this.coordsObj.get(this.options.geoLonProperty));

            this.centerMap(lon, lat);
        },

        /**
         * create the map object
         *
         * @private
         */
        _createMap: function() {
            if (!_.isNull(this.options.map)) {
                return;
            }
            var that = this,
                mapDiv = jQuery('<div>', {
                id:'midgardGeoMap',
                style:"height:200px; width:300px"
            });
            this.element.append(mapDiv);
            this.options.map = new OpenLayers.Map('midgardGeoMap');


            if (_.isNull(this.options.layer)) {
                this.options.layer = new OpenLayers.Layer.OSM("OSM");
            }

            this.options.map.addLayer(this.options.layer);

            this.options.markers = new OpenLayers.Layer.Markers("Markers");
            this.options.map.addLayer(this.options.markers);


            OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
                defaultHandlerOptions:{
                    'single':true,
                    'double':false,
                    'pixelTolerance':0,
                    'stopSingle':false,
                    'stopDouble':false
                },

                initialize:function (options) {
                    this.handlerOptions = OpenLayers.Util.extend(
                        {}, this.defaultHandlerOptions
                    );
                    OpenLayers.Control.prototype.initialize.apply(
                        this, arguments
                    );
                    this.handler = new OpenLayers.Handler.Click(
                        this, {
                            'click':function (e) {
                                that.mapClick(e);
                            }
                        }, this.handlerOptions
                    );
                }
            });


            var click = new OpenLayers.Control.Click();
            this.options.map.addControl(click);
            click.activate();

            var center  = this.options.defaultCenter.clone();
            center.transform(
                new OpenLayers.Projection(this.options.coordSystem),
                this.options.map.getProjectionObject()
            );

            this.options.map.setCenter(
                center, this.options.defaultZoomLevel
            );
        },

        mapClick:function (e) {
            var lonlat = this.options.map.getLonLatFromPixel(e.xy);
            lonlat.transform(this.options.map.getProjectionObject(), new OpenLayers.Projection(this.options.coordSystem));

            var panTo = lonlat.clone();
            this.centerMap(panTo.lon, panTo.lat);
            this.setCoordinates(lonlat.lat, lonlat.lon);
        },

        disable:function () {

        },

        /**
         * set coordinates to the model
         *
         * @param lat
         * @param lon
         */
        setCoordinates:function (lat, lon) {
            var geo = this.data.entity.get(this.options.geoProperty),
                coordsModel = geo.models[0];

            coordsModel.set(this.options.geoLatProperty, lat);
            coordsModel.set(this.options.geoLonProperty, lon);
        },

        /**
         * widget init
         *
         * @private
         */
        _init:function () {
            this.element.hide();
            this.element.append( jQuery('<h3>GEO</h3>') );
            if(_.isNull(this.options.defaultCenter)){
                this.options.defaultCenter = new OpenLayers.LonLat(0, 0);
            }
            this._createMap();
        },

        /**
         * coordinates should be given in the default coordiante system from config
         *
         * @param lon
         * @param lat
         */
        centerMap:function (lon, lat) {
            var center = new OpenLayers.LonLat(lon, lat).transform(
                    new OpenLayers.Projection(this.options.coordSystem),
                    this.options.map.getProjectionObject()
                );

            if (this.options.centermark) {
                this.options.centermark.destroy();
            }

            var size = new OpenLayers.Size(
                this.options.marker.size.w ,
                this.options.marker.size.h
            );
            var offset = new OpenLayers.Pixel(
                this.options.marker.offset.w ,
                this.options.marker.offset.h
            );
            var icon = new OpenLayers.Icon(this.options.marker.url, size, offset);
            this.options.centermark = new OpenLayers.Marker(center, icon);
            this.options.markers.addMarker(this.options.centermark);

            this.options.map.panTo(center);
        }
    });
})(jQuery);
