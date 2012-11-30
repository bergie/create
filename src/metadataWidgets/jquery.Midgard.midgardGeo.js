//     Create.js - On-site web editing interface
//     (c) 2012 Tobias Herrmann, IKS Consortium
//     Create may be freely distributed under the MIT license.
//     For all details and documentation:
(function (jQuery, undefined) {
    // Run JavaScript in strict mode
    'use strict';

    // This widget allows editing geocoordinates with the help of openlayers
    // and per default layer OSM
    jQuery.widget('Midgard.midgardGeo', {
        options:{
            layer:null,
            map:null,
            coordSystem:'EPSG:4326',
            defaultCenter: new OpenLayers.LonLat(0, 0),
            defaultZoomLevel: 3
        },
        data : {},

        /**
         * activate mapwidget
         *
         * @param data
         */
        activate: function (data) {
            this.data = data;

            var geo = this.data.entity.get('http://schema.org/geo');

            if(_.isUndefined(geo)) {
                this.element.hide();
                return;
            } else {
                this.element.show();
            }

            var coordsModel = geo.models[0],
                lat = parseFloat(coordsModel.get('http://schema.org/latitude')),
                lon = parseFloat(coordsModel.get('http://schema.org/longitude'));

            this.centerMap(lon, lat);
        },

        /**
         * create the map object
         *
         * @private
         */
        _createMap: function() {
            if (this.options.map !== null) {
                return;
            }
            var that = this,
                mapDiv = jQuery('<div>', {
                id:'midgardGeoMap',
                style:"height:200px; width:300px"
            });
            this.element.append(mapDiv);
            this.options.map = new OpenLayers.Map('midgardGeoMap');


            if (this.options.layer == null) {
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
            console.log('disable geo', this);
        },

        /**
         * set coordinates to the model
         *
         * @param lat
         * @param lon
         */
        setCoordinates:function (lat, lon) {
            var geo = this.data.entity.get('http://schema.org/geo'),
                coordsModel = geo.models[0];

            coordsModel.set('http://schema.org/latitude', lat);
            coordsModel.set('http://schema.org/longitude', lon);
        },

        /**
         * widget init
         *
         * @private
         */
        _init:function () {
            this.element.hide();
            this.element.append( jQuery('<p>GEO</p>') );
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

            var size = new OpenLayers.Size(21, 25);
            var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
            var icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', size, offset);
            this.options.centermark = new OpenLayers.Marker(center, icon)
            this.options.markers.addMarker(this.options.centermark);

            this.options.map.panTo(center);
        }
    });
})(jQuery);
