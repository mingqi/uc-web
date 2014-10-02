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
        compress: true
      },
      compile: {
        files: {
          'public/ace/assets/css/ace.min.css': 'public/ace/assets/css/less/ace.less',
        }
      }
    },

    cssmin: {
      options: {
        keepSpecialComments: 0,
      },
      compile: {
        files: {
          'public/s/tablesort.min.css': 'public/s/tablesort.css',
          'public/ace/assets/css/daterangepicker.min.css': 'public/ace/assets/css/daterangepicker.css'
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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-less');

  grunt.registerTask('css', ['sass', 'less']);
  grunt.registerTask('js', ['coffee', 'uglify']);
  grunt.registerTask('default', ['css', 'js', 'watch']);
};
