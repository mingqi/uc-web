var require = {
	baseUrl: '/b/js',
	urlArgs: 'v=' + +new Date,
	paths: {
		jquery: 'lib/jquery',
		underscore: 'lib/underscore',
		bootstrap: 'lib/bootstrap',
		angular: 'lib/angular',
		'angular-tablesort': 'lib/angular-tablesort',
		scrollTo: 'lib/jquery.scrollTo',
		ace: 'lib/ace',
		highstock: 'lib/highstock',
		moment: 'lib/moment',
		daterangepicker: 'lib/daterangepicker',
		con: 'console/main',
		pattern: 'console/log_pattern'
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
		ace: ['jquery', 'bootstrap'],
		con: ['bootstrap', 'angular-tablesort', 'ace', 'scrollTo']
	}
};
