define(["dojo/_base/declare", "dijit/_WidgetBase", "esri/config", "esri/urlUtils", "esri/tasks/query", "dojo/on", "dojo/mouse",
 "esri/renderers/SimpleRenderer", "esri/dijit/BasemapGallery", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", 
 "esri/Color", "app/utils/debouncer.js","dojo/_base/array", "dojo/dom", "dojo/query", "dojox/gesture/swipe", "esri/dijit/Measurement",
  "esri/dijit/LocateButton", "esri/layers/ArcGISDynamicMapServiceLayer", "dojo/ready", "dojo/parser", "dijit/TitlePane",
      "esri/layers/FeatureLayer", "esri/geometry/Point", "dojo/dom-style", "dojo/dom-attr", 
     "esri/graphic", "esri/layers/GraphicsLayer", "esri/symbols/PictureMarkerSymbol", "esri/dijit/HomeButton", "esri/dijit/util/busyIndicator",
     "esri/dijit/Scalebar", "esri/layers/GeoRSSLayer", "esri/geometry/Extent", "esri/SpatialReference", "esri/layers/ImageParameters",
     "esri/arcgis/OAuthInfo", "esri/IdentityManager", "esri/dijit/Legend", "esri/dijit/Popup", "esri/dijit/PopupTemplate", "dojo/dom-construct",
      "esri/symbols/SimpleFillSymbol", "esri/dijit/LayerList", "app/utils/bootstrapmap.min.js", "app/utils/appCacheManager.js", "app/OfflineWidget",
   "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin", "dijit/_AttachMixin","dojo/text!./templates/App.html",  "app/utils/offline-tiles-advanced-min.js"],

    function (declare, _WidgetBase, esriConfig, urlUtils, Query, on, mouse, SimpleRenderer, BasemapGallery, SimpleMarkerSymbol, SimpleLineSymbol, Color,
        debouncer, arrayUtils, dom, query, swipe, Measurement, LocateButton, ArcGISDynamicMapServiceLayer, ready, parser, TitlePane, FeatureLayer, Point, domStyle, domAttr, 
        Graphic, GraphicsLayer, PictureMarkerSymbol, HomeButton, busyIndicator, Scalebar,
        GeoRSSLayer, Extent, SpatialReference, ImageParameters, OAuthInfo, esriId, Legend, Popup,  PopupTemplate, domConstruct, SimpleFillSymbol, LayerList,
         BootstrapMap, AppCacheManager, OfflineWidget, _TemplatedMixin, _WidgetsInTemplateMixin,  _AttachMixin, template) {

        return declare("App", [ _WidgetBase, _TemplatedMixin,  _WidgetsInTemplateMixin, _AttachMixin, OfflineWidget], {
            
            templateString: template,
            widgetsInTemplate: true,
            
            constructor: function(params, srcNodeRef) {
               console.log(srcNodeRef);
            },

            loadhandle: null,
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
      
            
            var _loadListen = map.on('load', function(e) {
                _loadListen.remove();
               demo.endLoading();   
             });
                   
  
            var _listen = map.on("layers-add-result", function(e) {
               _listen.remove();
               offlineWidget.initPanZoomListeners();
            });

      
                  var homeButton = new HomeButton({
                      map: map,
                      visible: true
                  }, 'homeButton');
                  homeButton.startup();
              

         
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
              

               
                  var scalebar = new Scalebar({
                      map: map,
                      scalebarUnit: "dual"
                  }, dom.byId('scalebarHousing'));
              

           
                  var legend = new Legend({
                      arrangement: 2,
                      autoUpdate: true,
                      map: map,
                      respectCurrentMapScale: true
                      }, "legendDiv");

                      legend.startup();
          
      
              var measure = new Measurement({
                map: map,
                lineSymbol: new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                     new Color([255, 0, 0]),
                     3)
              });
                measure.startup();
                 // Create title pane for the measure tool
                var tp = new TitlePane({
                  title:"Measurement",
                  content: measure,
                  open: false
                });
                dom.byId("measurePane").appendChild(tp.domNode);
                tp.startup();

                 loadhandle = busyIndicator.create({
                      backgroundOpacity: 0.01,
                      target: mapDiv,
                      imageUrl: "app/resources/images/loading-throb.gif",
                      zIndex: 100
                  });
              

              function hideLoading() {
                  loadhandle.hide();
                  map.enableMapNavigation();
                  map.enablePan();
                }
    
               function showLoading() {
                  loadhandle.show();
                  map.disableMapNavigation();
                  map.disablePan();
                }

                var toc = new LayerList({
                  layers: null,
                  map: map,
                  removeUnderscores: true,
                  subLayers: true,
                }, "layerList");
                toc.startup();

              var offlineWidget = new OfflineWidget({
                  map: map,
                  onlineTest: serverUrl,
                  mapService: mapService,
                  tileServiceUrl: tileServiceUrl,
                  toc: toc
              }, dom.byId("offlineButtons"));
              
             offlineWidget.startup();

             
          
            offlineWidget.initialize(function(e) {
              var tileLayer = e.tiledMapService;
              map.addLayers([tileLayer, mapService]);
            });
                
            
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

               // Create Map Events
               

               
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
      });

});