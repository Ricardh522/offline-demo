define(["dojo/_base/declare", "dijit/_WidgetBase", "esri/config", "esri/urlUtils", "esri/tasks/query", "dojo/on", "dojo/parser", "dojo/mouse", "esri/renderers/SimpleRenderer", "esri/dijit/BasemapGallery",
     "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/Color", 
     "dojo/_base/array", "dojo/dom", "dojo/query", "dojox/gesture/swipe", "esri/dijit/Measurement", "esri/dijit/LocateButton", "esri/layers/ArcGISDynamicMapServiceLayer",
      "esri/layers/FeatureLayer", "esri/geometry/Point", "dojo/dom-style", "dojo/dom-attr", 
     "esri/graphic", "esri/layers/GraphicsLayer", "esri/symbols/PictureMarkerSymbol", "esri/dijit/HomeButton",
     "esri/dijit/Scalebar", "esri/layers/GeoRSSLayer", "esri/geometry/Extent", "esri/SpatialReference", "esri/layers/ImageParameters",
     "esri/arcgis/OAuthInfo", "esri/IdentityManager", "esri/dijit/Legend", "esri/dijit/Popup", "esri/dijit/PopupTemplate", "dojo/dom-construct",
      "esri/symbols/SimpleFillSymbol", "esri/dijit/LayerList", "app/utils/bootstrapmap.min.js", "app/utils/appCacheManager.js", "./OfflineWidget",
   "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin", 'dijit/_AttachMixin', "dojo/text!./templates/App.html", "dojo/domReady!"],

    function (declare, _WidgetBase, esriConfig, urlUtils, Query, on, parser, mouse, SimpleRenderer, BasemapGallery, SimpleMarkerSymbol, SimpleLineSymbol, Color,
        arrayUtils, dom, query, swipe, Measurement, LocateButton, ArcGISDynamicMapServiceLayer, FeatureLayer, Point, domStyle, domAttr, 
        Graphic, GraphicsLayer, PictureMarkerSymbol, HomeButton, Scalebar,
        GeoRSSLayer, Extent, SpatialReference, ImageParameters, OAuthInfo, esriId, Legend, Popup,  PopupTemplate, domConstruct, SimpleFillSymbol, LayerList,
         BootstrapMap, AppCacheManager, OfflineWidget, _TemplatedMixin, _WidgetsInTemplateMixin, _AttachMixin, template) {

          return declare("App", [_WidgetBase, _TemplatedMixin,  _AttachMixin, _WidgetsInTemplateMixin, OfflineWidget], {
            
            templateString: template,
            widgetsInTemplate: true,
            
            constructor: function(params, srcNodeRef) {
               console.log("creating widget with params " + dojo.toJson(params) + " on node " + srcNodeRef);
            },

            startup: function() {
              var appCacheManager;
              initAppCacheManager();
              
              function initAppCacheManager(){
                  appCacheManager = new AppCacheManager(true,true);
                  appCacheManager.setUpdateCache();
                  appCacheManager.setCacheListeners();
                  appCacheManager.getCacheStatus();
                  appCacheManager.on(appCacheManager.CACHE_EVENT,cacheEventHandler);
                  appCacheManager.on(appCacheManager.CACHE_ERROR,cacheErrorHandler);
                  appCacheManager.on(appCacheManager.CACHE_LOADED,cacheLoaderHandler);
              }

              function cacheLoaderHandler(evt){
                  if(evt == appCacheManager.CACHE_LOADED) alert("Application cache successfully loaded!");
              }

              function cacheEventHandler(evt){
                  console.log("CACHE EVENT: " + JSON.stringify(evt));
              }

              function cacheErrorHandler(evt){
                  console.log("CACHE ERROR: " + JSON.stringify(evt));
              }

              // var httpmachine = "http://127.0.0.1"
              // var sslmachine = "https://127.0.0.1"

              var httpmachine = "http://52.0.185.237";
              var sslmachine = "https://52.0.185.237";
              // var httpmachine = "http://52.0.46.248:6080"
              // var sslmachine = "https://52.0.46.248:6443"


              var serverUrl = httpmachine + "/waadmin/rest/services";
              // var serverUrl = httpmachine + "/arcgis/rest/services"

              // var mapName = "RSW/RSW_Utilities_MS";
              var mapName = "RSW/Utilities";

              var mapService = new ArcGISDynamicMapServiceLayer(serverUrl + '/' + mapName + '/MapServer');
              var tileServiceUrl = "http://52.0.185.237/waadmin/rest/services/RSW/WGS84Airfield/MapServer";
              var storedExtent = localStorage.offlineExtent;
              var mapExtent;
              var centerPnt;
              if (storedExtent  !== undefined) {
                  mapExtent= new Extent(JSON.parse(storedExtent));
                  centerPnt = mapExtent.getCenter();
                } else {
                   mapExtent = new Extent({
                      xmin: -9103233.409475232,
                      ymin: 3063243.168823139,
                      xmax: -9098484.759092892,
                      ymax: 3067518.8650929537,
                      spatialReference: {
                          wkid: 102100
                      }
                  });
                   centerPnt = mapExtent.getCenter();
                }
                
              var zoom;
              var storedZoom = localStorage.offlineZoom;
              if (storedZoom  !== undefined) {
                zoom = storedZoom;
              } else {
                zoom = 15;
              }


             var popupOptions = {
              markerSymbol: new SimpleMarkerSymbol("circle", 32, null, new Color([0, 0, 0, 0.25])),
              fillSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_CROSS,
                               new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255,0,0]), 2),
                                new Color([255,255,0,0.25])
                                )};

            //create a popup to replace the map's info window
            var popup = new Popup(popupOptions, domConstruct.create("div"));

              var map = BootstrapMap.create("mapDiv", {
                  center: centerPnt,
                  zoom: zoom,
                  sliderStyle: 'none',
                  logo: false,
                  fadeOnZoom: true,
                  isScrollWheelZoom: true,
                  isZoomSlider: true,
                  force3DTransforms: true,
                  maxZoom: 19,
                  minZoom: 14,
                  showLabels: true,
                  extent: mapExtent,
                  infoWindow: popup
              });
      
            function initHomeButton() {
                  var homeButton = new HomeButton({
                      map: map,
                      visible: true
                  }, 'homeButton');
                  homeButton.startup();
              }

              function initEsriLocate() {
                  var esriLocate = new LocateButton({
                      centerAt: true,
                      geolocationOptions: {
                          maximumAge: 0,
                          timeout: 15000,
                          enableHighAccuracy: true
                      },
                      highlightLocation: true,
                      map: map,
                      setScale: true,
                      theme: 'LocateButton',
                      useTracking: true,
                      visible: true
                  }, 'esriLocate');
              }

               function initScalebar() {
                  var scalebar = new Scalebar({
                      map: map,
                      scalebarUnit: "dual"
                  }, dojo.byId('scalebarHousing'));
              }

              function initLegend() {
                  var legend = new Legend({
                      arrangement: 2,
                      autoUpdate: true,
                      map: map,
                      respectCurrentMapScale: true
                      }, "legendDiv");

                      legend.startup();
              }

              function initLayerList() {
                  var toc = new LayerList({
                      layers: null,
                      map: map,
                      removeUnderscores: true,
                      subLayers: true
                    }, "layerList");
                  toc.startup();
                  offlineWidget.toc = toc;
              }
              
              function initMeasure() {
                  var measure = new Measurement({
                    map: map,
                    lineSymbol: new SimpleLineSymbol(
                        SimpleLineSymbol.STYLE_SOLID,
                         new Color([255, 0, 0]),
                         3)
                  }, dom.byId("esriMeasure"));
                    measure.startup();
                }

             function initHandle() {
                 var handle = busyIndicator.create({
                      backgroundOpacity: 0.01,
                      target: img,
                      imageUrl: "app/resources/images/loading-throb.gif",
                      zIndex: 100
                  });
                  var img = dom.byId('loadingImg');
                  domStyle.set(img, 'visibility', "hidden");
                  handle.hide();
              }

               map.on('load', function(e) {
                   initScalebar();
                   initHomeButton();
                   initEsriLocate();
                   initLegend();
                   initLayerList();
                   initMeasure();
                   initHandle();
              });

              var offlineWidget = new OfflineWidget({}, dom.byId("offlineButtons"));
              
              offlineWidget.startup({
                  map: map,
                  onlineTest: serverUrl,
                  mapService: mapService,
                  tileServiceUrl: tileServiceUrl
                });

                offlineWidget.initialize(function(e) {
                  var mapService = offlineWidget.mapService;
                  var tileLayer = offlineWidget.offlineTiles.tileLayer;
                  map.addLayers([tileLayer, mapService]);
                  var _listen = map.on("layers-add-result", function(e) {
                    _listen.remove();
                    initSplashPage();
                  });
                });
                
               function initSplashPage() {
                    var intro = $("#splashPage");
                    var mapPage = $(".container-fluid");
                    
                    mapPage.css('visibility', 'visible');
                    mapPage.css('opacity', 1);
                    intro.css('opacity', 0);
                    intro.css('visibility', 'hidden');
                    initEvents();
                }

              // DOM panel movement events
              var rightPanel = dom.byId("rightPanel");
              var infoPanel = dom.byId("infoPanel");
              var panels = dom.byId("panels");
              var width = domStyle.get(infoPanel, 'width');
              on(rightPanel, mouse.enter, function(evt) {
                  evt.preventDefault();
                  evt.stopPropagation();
                  domStyle.set(infoPanel, {
                      width: "250px",
                      overflowY: "scroll"
                  });
                  domStyle.set(panels, {
                      opacity: 1
                  });
                  domStyle.set(rightPanel, {
                    width: "20px"
                  });
                });

               on(panels, mouse.leave, function(evt) {
                  evt.preventDefault();
                  evt.stopPropagation();
                  domStyle.set(infoPanel, {
                      width: "15px",
                      overflowY: "hidden"
                  });
                   domStyle.set(panels, {
                      opacity: 0
                   });
                   domStyle.set(rightPanel, {
                    width: "15px"
                   });
                  
                });

               on(rightPanel, swipe, function(evt) {
                  if (swipe.dx !== 0) {
                    var width = domStyle.get(infoPanel, "width");
                    if (width === 20) {
                      domStyle.set(infoPanel, "width", "250px");
                      domStyle.set(panels, "opacity", 1);
                    } else {
                        domStyle.set(infoPanel, "width", "20px");
                        domStyle.set(panels, "opacity", 0); 
                      }
                  }
                });

               var initEvents = function() {

                    var hideLoading = function() {
                        var img = dom.byId('loadingImg');
                        this.waithandle.hide();
                        map.enableMapNavigation();
                        map.enablePan();
                      }.bind(this);

                     var showLoading = function() {
                        var img = dom.byId('loadingImg');
                        this.waithandle.show();
                        map.disableMapNavigation();
                        map.disablePan();
                      }.bind(this);

                    map.on("zoom-end",function(evt) {
                        _currentExtent = evt.extent;
                        that.updateLocalStorage();
                        Offline.check();
                    });

                    map.on("pan-end",function(evt) {
                        _currentExtent = evt.extent;
                        offlineWidget.updateLocalStorage();
                        Offline.check();
                    });


                    map.on("pan", function(evt) {
                        hideLoading();
                    });

                    map.on("zoom-start", function(evt) {
                        showLoading();
                    });

                    map.on("zoom-end", function(evt) {
                        hideLoading();
                    });

                    debouncer.setOrientationListener(250,function(){
                        console.log("orientation"); orientationChange = true;
                    });


                    document.addEventListener('touchmove', function(event) {
                      if (!$(event.target).parents().hasClass("touch-moveable"))
                          {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    } , false); 
                }
             }
          });

          ready(function() {
            parser.parse();
          });
      });