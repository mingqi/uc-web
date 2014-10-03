module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    sass: {
      dist: {
        options: {
          style: 'compressed'
        },
        files: [{
            expand : true,
            cwd : 'public/cc/css/scss',
            src : ['*.scss'],
            dest : 'public/cc/css/compiled',
            ext : '.css'
        }]
      }
    },

    less: {
      options: {
        compress: false
      },
      compile: {
        files: {
          'public/ace/assets/css/uncompressed/ace.css': 'public/ace/assets/css/less/ace.less',
        }
      }
    },

    cssmin: {
      options: {
        keepSpecialComments: 0,
      },
      compile: {
        files: {
          'public/s/css/site.css': [
            'public/cc/css/bootstrap/bootstrap.css',
            'public/cc/css/compiled/bootstrap-overrides.css',
            'public/cc/css/compiled/theme.css',
          ],
          'public/s/css/console.css': [
            'public/ace/assets/css/uncompressed/bootstrap.css',
            'public/ace/assets/css/uncompressed/ace.css',
            'public/s/font-awesome-4.1.0/css/font-awesome.css',
            'public/s/tablesort.css',
          ],
          'public/s/css/search.css': [
            'public/ace/assets/css/daterangepicker.css',
            'browser/css/console/search.css',
          ]
        }
      }
    },

    coffee: {
      options: {
        bare: true
      },
      compile: {
        files: {
          'uncompressed/console/log_pattern.js': 'uncompressed/console/log_pattern.coffee',
        }
      },
    },

    uglify: {
      options: {
        sourceMap: false,
      },
      compile: {
        files: {
          'public/s/site.js': [
              'public/cc/js/jquery.min.js',
              'public/cc/js/bootstrap.min.js',
              'public/cc/js/theme.js',
          ],
          'public/s/console/search.min.js': [
            'uncompressed/console/log_pattern.js',
            'uncompressed/console/search.js',
          ],
          'public/s/console/config.min.js': [
            'uncompressed/console/config.js',
          ],
          'public/ace/assets/js/date-time/daterangepicker.min.js':
            'public/ace/assets/js/date-time/daterangepicker.js',
          'public/s/angular-tablesort.min.js': 'public/s/angular-tablesort.js'
        }
      }
    },

    watch: {
      grunt: { files: ['Gruntfile.js'] },

      sass: {
        files: ['public/cc/css/scss/*.scss'],
        tasks: ['sass']
      }
    },

    requirejs: {
      // onefile: {
      //   options: {
      //     name: 'console/main',
      //     mainConfigFile: 'browser/js/jsconfig.js',
      //     optimize: 'uglify',
      //     out: 'browser/js/mini/console.js',
      //     preserveLicenseComments: false,
      //   }
      // },
      whole: {
        options: {
          appDir: 'browser/js',
          baseUrl: '.',
          mainConfigFile: 'browser/js/config.js',
          preserveLicenseComments: false,
          dir: 'public/s/js',
          modules: [{
            name: "console/logconfig"
          }, {
            name: "console/search"
          }]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  grunt.registerTask('css', ['sass', 'less']);
  grunt.registerTask('js', ['coffee', 'uglify']);
  grunt.registerTask('default', ['css', 'js', 'watch']);
};
