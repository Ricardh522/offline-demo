/*global profile:true*/
profile = {
    resourceTags: {
        test: function (filename, moduleId) {
            return false;
        },
        copyOnly: function (filename, mid) {
            return (/^app\/resources\//.test(mid) && !/\.css$/.test(filename) && /^app\/widgets\/libs\//.test(mid) && /^app\/libs\//.test(mid));
        },
        amd: function (filename, mid) {
            return !this.copyOnly(filename, mid) && /\.js$/.test(filename);
        }
    }
};
