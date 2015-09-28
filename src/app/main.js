var demo;
require(["dojo/_base/declare","dojo/dom","dojo/dom-style", "dojo/_base/fx"],
function(declare, dom, domStyle, fx){
    "use strict";
    var Demo = declare(null, {
        overlayNode:null,
        constructor:function(){
            // save a reference to the overlay
            this.overlayNode = dom.byId("loadingOverlay");
        },
        // called to hide the loading overlay
        endLoading:function(){
            fx.fadeOut({
                node: this.overlayNode,
                onEnd: function(node){
                    domStyle.set(node, 'display', 'none');
                }
            }).play();
        },

        
    });
    demo = new Demo();
});

define(['exports', 'app/widgets/myMobile',  "app/widgets/libs/appCacheManager"],
 function(app, myMobile, AppCacheManager) {
        "use strict";
        app.init = function() {
            app.myMobile = new myMobile(null, "appDiv");
            app.myMobile.startup();
            return app;
        };

        initAppCacheManager();
              var appCacheManager;
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

    });
 