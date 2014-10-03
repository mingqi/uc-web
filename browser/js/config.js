var require = {
	baseUrl: '/b/js',
	urlArgs: 'v=13',
	paths: {
		jquery: 'lib/jquery',
		underscore: 'lib/underscore',
		bootstrap: 'lib/bootstrap',
		angular: 'lib/angular',
		'angular-tablesort': 'lib/angular-tablesort',
		'scrollTo': 'lib/jquery.scrollTo.min',
		ace: 'lib/ace',
		con: 'console/main'
	},

	shim: {
		bootstrap: ['jquery'],
		angular: {
			exports: 'angular'
		},
		'angular-tablesort': ['angular'],
		ace: ['jquery'],
		con: ['bootstrap', 'angular-tablesort', 'ace']
	}
};
