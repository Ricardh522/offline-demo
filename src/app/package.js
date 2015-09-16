var profile = (function(){
    return {
        // now a typical loader packages configuration
        packages:[
             {
                name: "utils",
                location: "app/javascript/utils"
             },
             {
                name: "widgets",
                location: "app/javascript/widgets"
             }
        ],
        resourceTags: {
            amd: function(filename, mid) {
                return /\.js$/.test("main");
            }
        }
    }
})();