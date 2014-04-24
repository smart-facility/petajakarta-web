module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        files: {
          'build/js/application.js': ['banjir/vendor/js/*.js', 'banjir/assets/js/*.js'],
          'build/css/application.css': ['banjir/vendor/css/*.css', 'banjir/assets/css/*.css']
        }
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'build/js/application.js',
        dest: 'build/js/application.min.js'
      }
    },
    cssmin: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        keepSpecialComments: false
      },
      build: {
        src: 'build/css/application.css',
        dest: 'build/css/application.min.css'
      }
    },
    staticHandlebars: {
      en: {
        files: { 'build/en/*.html': 'banjir/assets/templates/*.hbs' },
        options: { json: 'banjir/assets/translations/en.json' }
      },
      in: {
        files: { 'build/in/*.html': 'banjir/assets/templates/*.hbs'},
        options: { json: 'banjir/assets/translations/in.json' }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-static-handlebars');

  // Tasks
  grunt.registerTask('assets', ['concat:dist', 'uglify:build', 'cssmin:build']);
  grunt.registerTask('site', ['staticHandlebars:en', 'staticHandlebars:in']);
  grunt.registerTask('default', ['assets', 'site']);

};
