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
            'public/s/font-awesome/css/font-awesome.css',
          ],
          'public/s/css/console.css': [
            'public/ace/assets/css/uncompressed/bootstrap.css',
            'public/ace/assets/css/uncompressed/ace.css',
            'public/s/font-awesome/css/font-awesome.css',
            'browser/css/lib/tablesort.css',
            'browser/css/console/console.css'
          ],
          'public/s/css/search.css': [
            'public/ace/assets/css/daterangepicker.css',
            'browser/css/console/search.css',
          ]
        }
      }
    },

    coffee: {
      multiple: {
        expand: true,
        cwd: 'browser/coffee',
        src: ['**/*.coffee'],
        dest: 'browser/js',
        ext: ".js"
      }
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
        }
      }
    },

    watch: {
      grunt: { files: ['Gruntfile.js'] },

      sass: {
        files: ['public/cc/css/scss/*.scss'],
        tasks: ['sass']
      },

      coffee: {
        files: ['browser/coffee/**/*.coffee'],
        tasks: ['coffee']
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
          optimize: 'uglify',
          modules: [{
            name: "console/logconfig"
          }, {
            name: "console/search"
          }]
        }
      }
    },

    jshint: {
      browser: {
        options: {
          undef: true,
          unused: true,
          asi: true,  // 忽略缺少分号
          browser: true,
          predef: ["require", "define", "angular", "confirm", "alert", "Highcharts"],
          globals: {
            require: true
          }
        },
        src: ['browser/js/console/*.js', 'browser/js/manage/*.js']
      },
      node: {
        options: {
          undef: true,
          unused: false,
          node: true,
          predef: [ "require", "module", "exports"]
        },
        src: ['*.js', 'lib/**/*.js', 'routers/**/*.js', 'routes/**/*.js']
      }
    },

    'string-replace': {
      jsVersion: {
        files: {
          'views/console/include/requirejs.ejs': 'views/console/include/requirejs.ejs'
        },
        options: {
          replacements: [{
            pattern: /urlArgs\s*:\s*['"](\d+)['"]/,
            replacement: function (p0, p1) {
              return 'urlArgs: "' + (parseInt(p1) + 1) + '"';
            }
          }]
        }
      },
      cssVersion: {
        files: {
          'views/console/include/css.ejs': 'views/console/include/css.ejs'
        },
        options: {
          replacements: [{
            pattern: /\.css\?(\d+)/,
            replacement: function (p0, p1) {
              return '.css?' + (parseInt(p1) + 1);
            }
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
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-string-replace');

  grunt.registerTask('css', ['sass', 'less', 'cssmin', 'string-replace:cssVersion']);
  grunt.registerTask('js', ['coffee', 'uglify']);
  grunt.registerTask('rjs', ['requirejs', 'string-replace:jsVersion']);
  grunt.registerTask('default', ['css', 'coffee', 'watch']);
};
