define(["dojo/_base/declare","dojo/_base/array", "dojo/dom-style", 
  "dojo/dom", "dojo/dom-class", "dojo/on",  "dojo/mouse", "dojo/Deferred", "dojo/dom-attr", "dojo/promise/all",
    "esri/geometry/webMercatorUtils", "esri/tasks/Geoprocessor", "dojo/_base/lang",
     "esri/tasks/IdentifyTask", "esri/tasks/IdentifyParameters",
     "esri/tasks/IdentifyResult","esri/tasks/FeatureSet",
      "esri/layers/ArcGISDynamicMapServiceLayer",
       "esri/layers/ImageParameters", "esri/geometry/Extent",
        "esri/dijit/PopupTemplate", "esri/layers/FeatureLayer", "esri/arcgis/utils",
         "esri/graphicsUtils", "esri/geometry/geometryEngine", "esri/tasks/query",
          "esri/tasks/QueryTask", "esri/geometry/Point",
  "esri/geometry/Polygon", 
   "esri/renderers/SimpleRenderer", "esri/symbols/TextSymbol", "esri/request",
     "dojo/dom-construct", "esri/symbols/SimpleFillSymbol",
     "esri/symbols/SimpleLineSymbol", "esri/Color",  "dijit/_WidgetBase",
      "dijit/_TemplatedMixin", "dojo/text! ./app/widgets/templates/myOfflineWidget.html", "app/widgets/libs/offline-tiles-advanced-src"],
  function (declare, arrayUtils, domStyle, dom, domClass, on, mouse, Deferred, domAttr, all,
 webMercatorUtils, Geoprocessor, lang, IdentifyTask,
  IdentifyParameters, IdentifyResult, FeatureSet, ArcGISDynamicMapServiceLayer,
   ImageParameters,  Extent, PopupTemplate, FeatureLayer, arcgisUtils, graphicsUtils, geometryEngine,
    Query, QueryTask, Point, Polygon, SimpleRenderer, TextSymbol,
     esriRequest, domConstruct, SimpleFillSymbol, SimpleLineSymbol,
    Color, _WidgetBase, _TemplatedMixin, template) { 

    "use strict";
     return declare("myOfflineWidget", [_WidgetBase, _TemplatedMixin], {   

            templateString: template,

            constructor: function(kwArgs, srcNodeRef) {
               console.log("creating widget with kwArgs");
               declare.safeMixin(this, kwArgs);
            },
            indexes: [],
            editStore: {
                DB_NAME:"features_store",  
                DB_STORE_NAME:  "features",
                DB_UID:  "objectid"
            },
            
            initialize: function(callback) {
                 var map = this.map;
                 var tileUrl = this.tileServiceUrl;
                
                 console.log("OfflineWidget Initializing Function fired");
                    
                if (Offline.state === 'up') {
                    _isOnline = true;
                }
                                
                this.tileLayer = new O.esri.Tiles.OfflineTileEnablerLayer(
                    tileUrl,
                    function (evt) {
                        console.log("Offline tile lib enabled. App is: " + Offline.state);
                    },_isOnline);

                this._minZoom = 14;
                this._maxZoom = 19;
                // Set up min and max boundaries for retrieving tiles
                this.minZoomAdjust = -1;
                this. maxZoomAdjust = 5;
                this.resetZoom = 15;
                this._currentZoom = null;
                // Important settings for determining which tile layers gets stored for offline use.
                this.EXTENT_BUFFER = 0; //buffers the map extent in meters
                this._currentExtent =  null;
                // For cancelling the download of tiles
                this._wantToCancel = false;
                this._downloadState =  "downloaded";
            
                callback({
                    tiledMapService: this.tileLayer,
                });
            },

            validate: function(callback) {
                var that = this;
                (function() {
                    var downloadTiles = dom.byId('downloadTiles');
                    var downloadFeatures = dom.byId('downloadFeatures');
                    var clearButton = dom.byId('clearButton');
                    var buttons = [downloadTiles, downloadFeatures, clearButton];

                    that.validateOnline(function(result) {
                     
                        if(result !== 'failed') {
                            _isOnline = true;
                            _isOffline = false;
                            //setUIOnline();
                           arrayUtils.forEach(buttons, function(e) {
                                    if (domClass.contains(e, "disabled") === true) {
                                        domClass.remove(e, "disabled");
                                    }
                                });
                            callback(_isOnline);
                           
                        }
                        else {
                            _isOnline = false;
                            _isOffline = true;
                            arrayUtils.forEach(buttons, function(e) {
                                    if (domClass.contains(e, "disabled") === false) {
                                        domClass.add(e, "disabled");
                                    }
                                });
                            callback(_isOnline);
                        }
                        
                    });
                })();
                    
                },

            startup: function() {
              
               var that = this;
               var editStore = this.editStore;
               var DB_NAME = editStore.DB_NAME;
               var DB_STORE_NAME = editStore.DB_STORE_NAME;
                 
                this.validate(function(e) {
                    console.log(e);
                });

                Offline.on('up down', that.updateState);

                //Make sure map shows up after a browser refresh
                if(Offline.state === 'up') {
                    zoom = 18 ;
                } else if (localStorage.offlineZoom !== undefined) {
                    zoom = localStorage.offlineZoom;
                }

                (function () {
                        request = indexedDB.open(DB_NAME, 11);
                        request.onupgradeneeded = function(event) {
                            var db = event.target.result;
                            var store = db.createObjectStore(DB_STORE_NAME, {keyPath: 'id'});
                            var index = store.createIndex("by_id", "id", {unique: true});
                            editStore._isDBInit = true;
                            db.close();
                        };

                        request.onsuccess = function(event) {
                          db = event.target.result;
                          editStore._isDBInit = true;
                          db.close();
                        };

                        request.onerror = function() {
                            editStore._isDBInit = false;
                            console.log(request.error);
                        };
                    })();


                $('#downloadTiles, #downloadFeatures, #clearButton').on('mousedown', function(e) {
                    e.preventDefault();
                    $(this).css('transform', 'scale(1.25, 1.25)');
                });

                $('#downloadTiles, #downloadFeatures, #clearButton').on('mouseout', function(e) {
                    e.preventDefault();
                    $(this).css('transform', 'scale(1, 1)');
                });

                $('#downloadTiles').on('mouseup', function(e) {
                    e.preventDefault();
                    $(this).css('-webkit-transform', 'scale(1, 1)');
                    that.downloadTiles();
                });

                var featureDownloadButton = dom.byId('downloadFeatures');
                on(featureDownloadButton, "mouseup", lang.hitch(this, function(e) {
                    e.preventDefault();
                    domStyle.set(featureDownloadButton,'-webkit-transform', 'scale(1, 1)');
                    this.startFeatureDownload(null);
                  }));
               

                $('#clearButton').on('mouseup', function(e) {
                    e.preventDefault();
                    $(this).css('-webkit-transform', 'scale(1, 1)');
                    var db;
                    var openDb = function (params, callback) {
                        request = indexedDB.open(DB_NAME, 11);
                        request.onupgradeneeded = function(event) {
                            var db = event.target.result;
                            var store = db.createObjectStore(DB_STORE_NAME, {keyPath: 'id'});
                            var index = store.createIndex("by_id", "id", {unique: true});
                            editStore._isDBInit = true;
                            db.close();
                        };

                        request.onsuccess = function(event) {
                          db = event.target.result;
                          editStore._isDBInit = true;
                          callback(db);
                        };

                        request.onerror = function() {
                            editStore._isDBInit = false;
                            console.log(request.error);
                        };
                    };

                    var getObjectStore = function (db, store_name, mode) {
                        
                        var tx = db.transaction(store_name, mode);
                        tx.onabort = function() {
                            console.log(tx.error);
                            return; 
                        };
                        return tx.objectStore(store_name);
                      };

                    
                   function clearObjectStore(db) {
                        var deferred = new Deferred();
                        var store = getObjectStore(db, DB_STORE_NAME, 'readwrite');
                        var req = store.clear();

                        req.onsuccess = function(evt) {
                            console.log("Store cleared");
                            deferred.resolve("sucess");
                        };

                        req.onerror = function (evt) {
                            console.error("clearObjectStore:", evt.target.errorCode);
                            deferred.resolve("fail");
                        };
                    return deferred.promise;
                    }

                    openDb(null, function(e) {
                        db = e;
                        var process = clearObjectStore(db);
                        process.then( function(results) {
                            var rem = function reCreate(callback) {
                                db.close();
                                that.clearMap(null, function(e) {
                                    callback();
                                });
                            };
                            
                            rem(function(e) {
                                that.displayMap(); 
                            }); 
                        });
                    });  
                });
            
            },

            /*Begin the process of downloading the feature services and collecting them in layerholder*/

            startFeatureDownload: function(param) {                
                var downloadTiles = dom.byId('downloadTiles');
                var downloadFeatures = dom.byId('downloadFeatures');

                var clearButton = dom.byId('clearButton');
                var buttons = [downloadTiles, downloadFeatures, clearButton];
                var map = this.map;
                var mapServiceUrl = this.mapService.url;
                var that = this;
                 // function labelLayers(lyr, callback) {
                 //    if (lyr.geometryType === 'esriGeometryPolyline') {
                 //        var myGraphics = new MyGraphics();
                 //        var forceMainLabel = "{DIAMETER} {MATERIAL} {MATERIALCLASS} {ITEMDESCRIPTION}";
                 //        var gravityMainLabel = "{DIAMETER} {MATERIAL} {MATERIALCLASS} @ {SLOPE} %"; 
                 //        var reclaimMainLabel = "{DIAMETER} {MATERIAL}";
                 //        var pressurizedMainLabel = "{DIAMETER} {MATERIAL} {MATERIALCLASS} {ITEMDESCRIPTION}";
                 //        var needLabel = {
                 //            "RECLAIM MAIN": reclaimMainLabel,
                 //            "GRAVITY MAIN": gravityMainLabel,
                 //            "FORCE MAIN": forceMainLabel,
                 //            "PRESSURIZED MAIN": pressurizedMainLabel
                 //        };
                 //        var name = lyr.name.toUpperCase();
                 //        var keys = Object.keys(needLabel);
                 //        if (keys.indexOf(name) !== -1) {
                 //            var label = needLabel.name;
                 //            myGraphics.labelLayer(label, lyr, function(e) {
                 //                callback(lyr);
                 //            });
                 //        }
                 //    } else {
                 //        callback(lyr);
                 //        }
                 //    }

                function setLayerDef (layer, query, callback) {
                    layer.queryIds(query, function(oids) {
                        if (oids) {
                            console.log(oids);
                            layer.setDefinitionExpression("OBJECTID IN (" + oids.join(',') + ")");
                            callback(layer);
                        } else {
                            console.log("no oids returned");
                            callback(false);
                        }
                    }, function(err) {
                        console.log(false);
                    });
                }

                
                this.clearMap(null, function(evt) {
                    
                      var extent = map.extent;
                      var i = [];
                      var index = 0;
                     
                      var visibleLayers = that.mapService.visibleLayers;

                        var requests = arrayUtils.map(visibleLayers, function(id) {
                            var deferred = new Deferred();
                            var item = mapServiceUrl + "/" + id;
                            var request = new esriRequest({
                                url: item,
                                content: {f: "json"},
                                handleAs: "json",
                                callbackParamName: "callback"
                            }, {
                                usePost: true
                            });
                            deferred.resolve(request);
                            return deferred;
                        });

                        all(requests).then(function(results) {
                            var layerlist = [];
                            var layerholder = {
                                    polys: [],
                                    lines: [],
                                    points:[],
                                    labels: []
                                };
                                    
                            var mapArray = arrayUtils.map(results, function(request) {
                                var deferred = new Deferred();
                                 request.then(function(response) {
                                    if (response.type === "Feature Layer") {
                                        var id = response.id;
                                        var fields = response.fields;
                                        // create the field info array for the feature layer
                                        var fieldinfo = [];
                                        var count;
                                        for (count=0; count < fields.length; count ++) {
                                    
                                                var f = fields.shift();
                                                var entry = {
                                                    fieldName: f.name,
                                                    label: f.alias,
                                                    visible: true
                                                };

                                                fieldinfo.push(entry);
                                        }

                                        var popupTemplate = new PopupTemplate({
                                            title: response.name,
                                            fieldInfos: fieldinfo,
                                            showAttachments: false
                                        });

                                        var url  = mapServiceUrl + "/" + id;
                                         var layer = new FeatureLayer(url, {
                                            mode: FeatureLayer.MODE_SNAPSHOT,
                                            infoTemplate: popupTemplate,
                                            outFields: ["*"],
                                            visible: true
                                        });
                        
                                        var query = new Query();
                                        query.geometry = extent;
                                        query.returnGeometry = false;
                                        query.outFields = ["*"];
                                       
                                        setLayerDef(layer, query, function(e) {
                                            if (e !== false) {
                                                var geo = response.geometryType;
                                                switch (geo) {
                                                    case "esriGeometryPolygon":
                                                        layerholder.polys.push(e);
                                                        break;
                                                    case "esriGeometryPolyline":
                                                        layerholder.lines.push(e);
                                                        break;
                                                    case "esriGeometryPoint":
                                                        layerholder.points.push(e);
                                                        break;
                                                    }
                                                    deferred.resolve(true);
                                                } else {
                                                    deferred.resolve(false);
                                                }
                                            }); 
                                        } else {
                                            deferred.resolve(false);
                                        }
                                    });
                                    return deferred.promise;
                                });

                        all(mapArray).then(function(result) {

                            var _maplisten = map.on('layers-add-result', function(evt) {
                                _maplisten.remove();
                              
                                that.toc.refresh();
                               
                                var ids = map.graphicsLayerIds;
                                var promises = arrayUtils.map(ids, function(id) {
                                        var deferred = new Deferred();
                                        var layer = map.getLayer(id);
                                        console.log(layer.name); 
                                        if (layer.graphics.length === 0) {
                                                 console.log("graphics have not be created yet");
                                       
                                            	var _listen = layer.on('update-end', function(evt) {
                                            		_listen.remove();
                                            		deferred.resolve(layer);
                                            	});
                                            
                                         } else if (layer.graphics.length > 0) {
                                                 deferred.resolve(layer);
                                        }
                                        return deferred;        
                                });

                                
                                all(promises).then(function(results) {
                                    console.log(results);
                                    
                                    that.initOfflineDatabase(results);  
                                });
                            });
                            var points = layerholder.points;
                            var layerlist = points.concat(layerholder.lines, layerholder.polys);

                            var tocLayers = [];
                            for (i = 0; i < layerlist.length; i +=1) {
                                var outlayer = {
                                    layer: layerlist[i]
                                };
                                tocLayers.push(outlayer);
                            }
                            that.toc.layers = tocLayers;
                           
                            map.addLayers(layerlist);
                        });
                    });
                });
            },
          
            
         /*////////////////////////////////
        /Online Offline Methods
       //////////////////////////////////*/
            updateState: function(){
              var that = this;
                if(Offline.state === 'up'){
                    that.toggleStateUp(true);
                }
                else{
                    that.toggleStateUp(false);
                }
            },

            toggleStateUp: function (state){
                var downloadTiles = dom.byId('downloadTiles');
                var downloadFeatures = dom.byId('downloadFeatures');
                var clearButton = dom.byId('clearButton');
                var buttons = [downloadTiles, downloadFeatures, clearButton];
                var that = this;
                var tileLayer = this.offlineTiles.tileLayer;
                    if(state){
                        tileLayer.goOnline();
                        that.clearMap(null, function(e) {
                            that.displayMap();
                            arrayUtils.forEach(buttons, function(e) {
                                    if (domClass.contains(e, "disabled") === true) {
                                        domClass.remove(e, "disabled");
                                    }
                                });
                        });
                        
                    }
                        else{
                            tileLayer.goOffline();
                            that.clearMap(null, function(e) {
                            	that.loadOffline();
                                arrayUtils.forEach(buttons, function(e) {
                                    if (domClass.contains(e, "disabled") === false) {
                                        domClass.add(e, "disabled");
                                    }
                                });
                            });
                        }
                    },

              /**
             * Attempts an http request to verify if app is online or offline.
             * Use this in conjunction with the offline checker library: offline.min.js
             * @param callback
             */
            validateOnline: function(callback) {
                var that = this;
                (function(evt) {
                    Offline.check();

                    var req = new XMLHttpRequest();
                    var maxWaitTime = 100000;
                    var noResponseTimer = setTimeout(function() {
                        req.abort();
                        callback('failed');
                        return;
                    }, maxWaitTime);

                    if (Offline.state === 'up') {
                        req.open("GET", that.onlineTest, false);
                        req.onreadystatechange = function() {
                            var status = req.status;
                            if (this.readyState != 4) {
                                return;
                            }
                            if (this.readyState == 4 && this.status == 200) {
                                
                                clearTimeout(noResponseTimer); 
                                
                                req.onload = function() {
                                    req = null;
                                    callback(true);
                                    };
                                } else {
                                    console.log("verifyOffline failed");
                                    req = null;
                                    callback('failed');
                                }
                        };

                        req.onerror = function(e) {
                            console.log("verifyOnline failed: " + e);
                            callback('failed');
                        };
                    try {
                        req.send(null);    
                    } catch(err) {
                        console.log(err);
                    }
                        
                } 
                else {
                    callback('failed');
                }

               
                })();
                    
            },

            ////////////////////////////////////
            //Tile Layer Functions////
            ////////////////////////////////////

             /**
             * Forces offlineTileEnabler to go online or offline.
             * If it is offline it will try to find a tile in the local database.
             */
            goOnlineOffline: function(){
                var btn = document.getElementById('state-span');
                if(btn.innerHTML == " Up"){
                    toggleStateUp(false);
                    console.log("Map is offline");
                }
                else{
                    toggleStateUp(true);
                    console.log("Map is online");
                }
            }, 

             /**
             * Manually starts the process to download and store tiles
             * in the local database
             */
            downloadTiles: function(callback){
                
                var tileLayer = this.tileLayer;
                var minZoomAdjust = this.minZoomAdjust;
                var maxZoomAdjust = this.maxZoomAdjust;
                var EXTENT_BUFFER = this.EXTENT_BUFFER;
                var map = this.map;
                

                tileLayer.deleteAllTiles(function(success,err){
                    var deferred = new Deferred();
                    if(success === false){
                        alert("There was a problem deleting the tile cache");
                    }
                    else{
                        console.log("success deleting tile cache");
                        var self = this.data;

                        if(this.downloadState == 'downloading')
                        {
                            console.log("cancel!");
                            _wantToCancel = true;
        

                         
                        }
                        else
                        {
                            var zoom = tileLayer.getMinMaxLOD(minZoomAdjust,maxZoomAdjust);

                            var extent = tileLayer.getExtentBuffer(EXTENT_BUFFER,map.extent);
                            _wantToCancel = false;
                             var message = "<span id='message' style='z-index: 100; position: absolute; top: 0px; right: 5px; font: black; arial; text-shadow: 1px 1px 3px white'>downloading tiles...</span>";
                            $('#navbar' ).append(message);
                            tileLayer.prepareForOffline(zoom.min, zoom.max, extent, this.reportProgress.bind(this));
                            this.downloadState = 'downloading';
                        }
                    }

                
                }.bind(this));

                
            },

            /**
             * Reports the process while downloading tiles. and initiates the feature layer downloads upon completion
             */
            reportProgress: function(progress) {
               
               var that = this;
                if(progress.hasOwnProperty("countNow")){}

                if( progress.finishedDownloading ){
                    
                
                    if( progress.cancelRequested )
                    {
                        that.downloadState = 'cancelled';
                        alert("Tile download was cancelled");
                    
                    }
                    else
                    {
                        that.downloadState = 'downloaded';
                        alert("Tile download complete");
          

                        that.tileLayer.saveToFile("myOfflineTilesLayer.csv", function(success, msg) {
                            console.log(success);
                            console.log(msg);
                        });
                    }

            
                }
                return _wantToCancel; //determines if a cancel request has been issued
            },


           

            clearMap: function(params, callback) {
                var map = this.map;
                var graphicIds = map.graphicsLayerIds;
                var mapIds = map.layerIds;
                var totalIds = mapIds.concat(graphicIds);
                var that = this;
                if (totalIds.length > 1) {
                    for (i=1; i < totalIds.length; i++) {
                        var layer = map.getLayer(totalIds[i]);
                        map.removeLayer(layer);
                    }
                }
                if (map.graphicsLayerIds.length === 0) {
                    console.log("All graphic layers removed from Map");
                    callback();
                }

                 if (that.hasOwnProperty("toc")) {
                        that.layers = null;
                    }
            },

            displayMap: function() {
                var map = this.map;
                var _layer = this.mapService;
                var that = this;
                var _listener = map.on('layer-add-result', function(e) {
                    console.log("Map Service Added back to Map");
                    _listener.remove();
                 
                });

                this.toc.layers = [{
                	layer: _layer,
                	sublayers: true
                }];
                this.toc.refresh();
                map.addLayer(_layer);
            },

            updateLocalStorage: function() {
                var map = this.map;
                var zoom = map.getZoom();
                var extent = JSON.stringify(map.extent);

                if (typeof (Storage) !== "undefined") {
                    localStorage.offlineZoom = zoom;
                    localStorage.offlineExtent = extent;
                    console.log("Done updating zoom and extent to localStorage.");
                } else {
                    alert("The offline library is not supported on this browser.");
                }
            },
         
              ///////////////////////////////////////////
             /// Offline Feature Functions//
            ///////////////////////////////////////////

                initOfflineDatabase: function(layerholder) {
                    var that = this;
                    that.buildDatabase(layerholder, function(e) {
                        console.log(e);
                        var clearNode = dom.byId("clearButton");
                        var tileNode = dom.byId("downloadTiles");
                        var featureNode = dom.byId("downloadFeatures");

                        if(_isOnline === true){
                             var test = 1;
                             if (test === 0) {
                                that.clearMap(null, function(e) {
                                    that.displayMap();
                                    
                                    domClass.remove(tileNode, "disabled");
                                    domClass.remove(clearNode, "disabled");
                                    domClass.remove(featureNode, "disabled");
                                });
                            } else {
                                 that.clearMap(null, function(e) {
                                    that.loadOffline();
                                });
                            }

                        } else {
                             that.clearMap(null, function(e) {
                                that.loadOffline();
                                domClass.add(tileNode, "disabled");
                                domClass.add(clearNode, "disabled");
                                domClass.add(featureNode, "disabled");
                            });
                        }
                    });
                    
                },

                 /**
                 * **********************************************
                 * EVENT LISTENER MANAGEMENT CODE
                 * **********************************************
                 */

                initPanZoomListeners: function () {
                   this.validate(function(e) {
                        console.log(_isOnline + " :ArcServer machine accessible");
                    });

                    var map = this.map;
                    var that = this;
                  
                    map.on("zoom-end",function(evt) {
                        _currentExtent = evt.extent;
                        that.updateLocalStorage();
                        Offline.check();
                    });

                    map.on("pan-end",function(evt) {
                        _currentExtent = evt.extent;
                        that.updateLocalStorage();
                        Offline.check();
                    });

                      if (Offline.state === 'up') {
                          _isOnline = true;
                          _isOffline = false;
                      } else {
                          _isOnline = false;
                          _isOffline = true;
                      }
                },
                

                 /**
                 * Load the feature while offline using information stored in database
                 */

                 getFeatureLayerJSONDataStore: function(inlayer, callback){
                        var dataStore = this.getFeatureLayerJSON(inlayer);
                        var success;
                        if (typeof dataStore === "object") {
                            success = true;
                        } else {
                            success = false;
                        }
                            callback(success, dataStore);
                    },

                loadOffline: function () {
            
                    var map = this.map;
                    var that = this;
                    var layerholder = {
                        points: [],
                        lines: [],
                        polys: []
                    };
                    // retreive the features from indexedDB and load into the map
                     this.initDB(function(e) {
                            var editStore = that.editStore;
                            var request = indexedDB.open(editStore.DB_NAME, 11);
                            request.onsuccess = function(event) {
                                    var map = that.map;
                                    var db = event.target.result;
                                    var tx = db.transaction([editStore.DB_STORE_NAME], 'readonly');
                                    var store = tx.objectStore(editStore.DB_STORE_NAME);
                                    var index = store.index('by_id');
                                    var request = index.openCursor(null, 'next');
                                        //retrieve each entry from the dataStore
                                    request.onsuccess = function(event) {
                                        var cursor = event.target.result;
                                        if (cursor) {
                                          
                                            var dataStore = cursor.value;
                                            var testLayer = new FeatureLayer(JSON.parse(dataStore.featureLayerCollection));
                                             // create the field info array for the feature layer
                                            var fieldinfo = [];
                                            var fields = testLayer.fields;
                                            var count;
                                           
                                            for (count=0; count < fields.length; count ++) {
                                                
                                                    var f = fields.shift();
                                                    var entry = {
                                                        fieldName: f.name,
                                                        label: f.alias,
                                                        visible: true
                                                    };

                                                    fieldinfo.push(entry);
                                            }

                                            var popupTemplate = new PopupTemplate({
                                                title: testLayer.name,
                                                fieldInfos: fieldinfo
                                            });
                                            if(testLayer.url === null){
                                                testLayer.url = dataStore.featureLayerUrl;
                                            }
                                            testLayer.infoTemplate = popupTemplate;

                                            testLayer.visible = true;
                                            var geo = testLayer.geometryType;
                                            switch (geo) {
                                                case "esriGeometryPolygon":
                                                    layerholder.polys.push(testLayer);
                                                    break;
                                                case "esriGeometryPolyline":
                                                    layerholder.lines.push(testLayer);
                                                    break;
                                                case "esriGeometryPoint":
                                                    layerholder.points.push(testLayer);
                                                    break;
                                                }
                                            
                                            cursor.continue();

                                        }
                                    };

                                    tx.oncomplete = function(evt) {
                                      console.log("transaction completed collecting layers from store");
                                      promises = [];
                                        var polys = layerholder.polys;
                                        var points = layerholder.points;
                                        var lines = layerholder.lines;
                                        var layerlist = polys.concat(lines, points);
                                        var tocLayers = [];
                                        for (i=0; i<layerlist.length; i+=1) {
                                            tocLayers.push({
                                                layer: layerlist[i]
                                            });
                                        }

                                          
                                            var _layerListen = map.on('layers-add-result', function(evt) {
                                                _layerListen.remove();
                                                that.toc.layers = tocLayers;
                                                that.toc.refresh();
                                        
                                                
                                                });
                                            
                                       that.map.addLayers(layerlist);
                                    };
                                };

                                request.onerror = function() {
                                        alert("There was a problem retrieving feature layer options object. " + dataStore);
                                        callback(false);
                                };
                            });
                },

                /**
                 * **********************************************
                 * IndexedDB Code
                 * **********************************************
                 */

                 // Initialize the database as well as set offline data.
                 initDB: function(callback) {
                    var editStore = this.editStore;
                        if(!editStore._isDBInit) {
                            var request = indexedDB.open(editStore.DB_NAME, 11);
                            request.onupgradeneeded = function() {
                                var db = request.result;
                                var names = db.objectStoreNames;
                                
                                if (names.contains(editStore.DB_STORE_NAME)) {
                                    db.close();
                                } else {
                                    var store = db.createObjectStore(editStore.DB_STORE_NAME, {keyPath: "id"});
                                    var index = store.createIndex("by_id", "id", {unique: true});
                                    db.close();
                                }

                            };
                            
                             request.onsuccess = function() {
                                var db = request.result;
                                db.close();
                            };
                            editStore._isDBInit = true;
                            
                        }
                        callback();
                       

                    },

                buildDatabase: function (layerholder, callback){
                        
                        // params should be an object of {json: layer}
                        var editStore = this.editStore;
                        editStore._featureLayers = [];
                        var that = this;
                        that.initDB(function(e) {
                            var db;
                            var deferred = new Deferred();
                            var request = indexedDB.open(editStore.DB_NAME, 11);
                            request.onsuccess = function(evt) {
                                    db = evt.target.result;
                                    
                                    var myDataStore = function (layer) {
                                          var dataStore = that.getFeatureLayerJSON(layer);
                                          dataStore.id = layer.name;
                                          var FEATURE_COLLECTION_ID = layer.name + '_collection';
                                          layer.offlineExtended = true; // to identify layer has been extended
                                          layer.objectIdField = editStore.DB_UID;
                                          var url = null;
                                          if(layer.url) {
                                                url = layer.url;
                                                // we keep track of the FeatureLayer object
                                                editStore._featureLayers[layer.url] = layer;
                                          }

                                          return dataStore;
                                    };

                                    var entries = [];
                                    arrayUtils.forEach(layerholder, function(layer) {
                                        var deferred = new Deferred();
                                        var entry = myDataStore(layer);
                                        deferred.resolve(entry);
                                        entries.push(deferred);
                                    });
                                    
                                    var tx = db.transaction(editStore.DB_STORE_NAME, 'readwrite');
                                    var store = tx.objectStore(editStore.DB_STORE_NAME);

                                    var allEntries = all(entries);
                                    allEntries.then(function(results) {
                                    	console.log(results);
                                        arrayUtils.forEach(results, function(entry) {
                                            console.log(entry);
                                            store.put(entry);
                                            console.log("entry put");
                                        });
                                    });
                                    

                                    tx.oncomplete = function() {
                                       deferred.resolve('all features loaded into indexedDB');
                                    };

                                    tx.onabort = function() {
                                        console.log(tx.errorCode);
                                        deferred.resolve('error');
                                    };
                                };
                            request.onerror = function(evt) {
                                console.log(evt.target.errorCode);
                                deferred.resolve('error');
                            };

                            deferred.then(function(e) {
                                callback(e);
                            });
                          
                        });
                    },

                getFeatureLayerJSON: function (item) {
                        
                    var map = this.map;
                    return {
                        "featureLayerCollection": JSON.stringify(item.toJson()),
                        "zoomLevel": map.getZoom(),
                        "centerPt" : (map.extent.getCenter()).toJson(),
                        "featureLayerUrl": item.url
                    };
                },

                updateFeatureLayerJSON: function () {
                        var that = this;
                        var testLayers =  this.testLayers;
                        arrayUtils.forEach(testLayers, function(item) {
                             var fl = that.getFeatureLayerJSON(item);
                            item.setFeatureLayerJSONDataStore(fl,function(result,error){
                            console.log("updateFeatureLayerJSON - Result: " + result + ", error: " + error);
                            });
                        });
                }
        });
     });
