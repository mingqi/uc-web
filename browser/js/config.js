var require = {
	baseUrl: '/b/js',
	urlArgs: 'v=' + (new Date() * 1),
	paths: {
		jquery: 'lib/jquery',
		underscore: 'lib/underscore',
		bootstrap: 'lib/bootstrap',
		angular: 'lib/angular',
		'angular-tablesort': 'lib/angular-tablesort',
		'angular-sanitize': 'lib/angular-sanitize',
		scrollTo: 'lib/jquery.scrollTo',
		ace: 'lib/ace',
		highstock: 'lib/highstock',
		moment: 'lib/moment',
		daterangepicker: 'lib/daterangepicker',
		con: 'console/con',
		pattern: 'console/log_pattern',
		searchStats: 'console/search-stats'
	},

	shim: {
		bootstrap: ['jquery'],
		scrollTo: ['jquery'],
		moment: {
			noGlobal: false
		},
		daterangepicker: ['jquery', 'moment'],
		angular: {
			exports: 'angular'
		},
		'angular-tablesort': ['angular'],
		'angular-sanitize': ['angular'],
		ace: ['jquery', 'bootstrap'],
		con: ['bootstrap', 'angular-tablesort', 'ace']
	}
};
