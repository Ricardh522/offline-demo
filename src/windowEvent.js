window.addEventListener('load', function(evt) {
        
        var appCache = window.applicationCache;

        var status = function() {
          switch (appCache.status) {
            case appCache.UNCACHED: // UNCACHED == 0
              return 'UNCACHED';
            case appCache.IDLE: // IDLE == 1
              return 'IDLE';
            case appCache.CHECKING: // CHECKING == 2
              return 'CHECKING';
            case appCache.DOWNLOADING: // DOWNLOADING == 3
              return 'DOWNLOADING';
            case appCache.UPDATEREADY:  // UPDATEREADY == 4
              return 'UPDATEREADY';
            case appCache.OBSOLETE: // OBSOLETE == 5
              return 'OBSOLETE';
            case appCache.CACHE_LOADED:
              return 'CACHE LOADED';
            default:
              return 'UKNOWN CACHE STATUS';
          }
        };

        appCache.addEventListener('updateready', function(evt) {
            if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
                // Browser downloaded a new app cache.
                if (confirm('A new version of this cache is available.')) {
                    window.location.reload();
                    console.log("App cache reloaded");
                    appCache.swapCache();
                }
            } else {
                // Manifest didn't changed. Nothing new to server.
                console.log("App cache no change");
            }
        }, false);

    }, false);