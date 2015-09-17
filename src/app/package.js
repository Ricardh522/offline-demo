var profile = (function(){
    return {
        // now a typical loader packages configuration
        packages:[
             {
                name: "utils",
                location: "app/utils"
             }
        ],
        resourceTags: {
            amd: function(filename, mid) {
                return /\.js$/.test(filename);
            }
        }
    };
})();