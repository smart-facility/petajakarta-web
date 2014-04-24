module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        files: {
          'build/application.js': ['banjir/vendor/js/*.js', 'banjir/assets/js/*.js'],
          'build/application.css': ['banjir/vendor/css/*.css', 'banjir/assets/css/*.css']
        }
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'build/application.js',
        dest: 'build/application.min.js'
      }
    },
    cssmin: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        keepSpecialComments: false
      },
      build: {
        src: 'build/application.css',
        dest: 'build/application.min.css'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Default task(s).
  grunt.registerTask('assets', ['concat:dist', 'uglify:build', 'cssmin:build']);
  grunt.registerTask('default', ['assets']);

};
