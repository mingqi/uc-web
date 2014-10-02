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
          ]
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

  grunt.registerTask('css', ['sass']);
  grunt.registerTask('js', ['coffee', 'uglify']);
  grunt.registerTask('default', ['css', 'js', 'watch']);
};
