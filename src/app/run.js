(function() {
    config = {
      
      baseUrl: './',
      packages: [
        // Using a string as a package is shorthand for `{ name: 'app', location: 'app' }`
        'app',
        'dgrid',
        'dijit',
        'dojo',
        'dojox',
        'esri',
        'put-selector',
        'xstyle'
      ]
    };
    
    require(config, ['app']);
})();