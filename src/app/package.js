var profile = {
    // point basePath to ~/dev
    basePath:".",

    // point releaseDir to ~/dev/myapp-deploy
    releaseDir:"../../dist",

    // now a typical loader packages configuration
    packages:[
         {
            "name": "utils",
            "location": "javascript/utils"
         },
         {
            "name": "widgets",
            "location": "javascript/widgets"
         }
    ]
}