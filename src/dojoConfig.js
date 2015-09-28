/*jshint unused:false*/
var dojoConfig = {
	async: true,
	baseUrl: '',
	tlmSiblingOfDojo: false,
	isDebug: true,
	parseOnLoad: false,
	packages: [
		'dojo',
		'dijit',
		'dojox',
		'put-selector',
		'xstyle',
		'dgrid',
		'app',
		'esri'
	],
	deps: [ 'app'],
	callback: function (app) {
		app.init();
	}
};
