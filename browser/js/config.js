require.config({
	baseUrl: '/b/js',
	paths: {
		jquery: 'lib/jquery',
		underscore: 'lib/underscore',
		bootstrap: 'lib/bootstrap',
		angular: 'lib/angular',
		'angular-tablesort': 'lib/angular-tablesort'
	},

	shim: {
		bootstrap: ['jquery'],
		angular: {
			exports: 'angular'
		},
		'angular-tablesort': ['angular']
	}
});
