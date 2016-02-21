module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      commonJs: {
          src: [
            'banjir/vendor/js/jquery-1.10.2.min.js',
            'banjir/vendor/js/bootstrap.min.js',
          ],
          dest: 'build/banjir/js/common.js'
      },
      siteJs: {
        src: [
          'banjir/vendor/js/jquery.growl.js',
          'banjir/vendor/js/jquery.scrollUp.min.js'
        ],
        dest: 'build/banjir/js/site.js'
      },
      mapJs: {
          src: [
            'banjir/vendor/js/jquery-1.10.2.min.js',
            'banjir/vendor/js/leaflet.js',
            'banjir/vendor/js/leaflet-providers.js',
            'banjir/vendor/js/L.Control.MousePosition.js',
            'banjir/vendor/js/leaflet.markercluster.js',
            'banjir/vendor/js/spin.min.js',
            'banjir/vendor/js/leaflet.spin.js',
            'banjir/vendor/js/topojson.js',
            'banjir/vendor/js/rsvp.js',
            'banjir/vendor/js/Chart.min.js',
            'banjir/vendor/js/url.min.js',
            'banjir/assets/js/validation.js',
            'banjir/assets/js/map.js'
          ],
          dest: 'build/banjir/js/map.js'
      },
      commonCss: {
          src: [
                'banjir/vendor/css/bootstrap.min.css'
            ],
         dest: 'build/banjir/css/common.css'
      },
      siteCss: {
        src: [
            'banjir/vendor/css/jquery.growl.css',
            'banjir/assets/css/main.css',
            'banjir/assets/css/map-page.css'
        ],
        dest: 'build/banjir/css/site.css'
      },
      mapCss: {
          src: [
              'banjir/vendor/css/MarkerCluster.css',
              'banjir/vendor/css/MarkerCluster.default.css',
              'banjir/vendor/css/L.Control.MousePosition.css',
              'banjir/vendor/css/leaflet.css',
              'banjir/assets/css/map.css'
          ],
          dest: 'build/banjir/css/map.css'
        }
    },
    jshint: {
      beforeconcat: ['banjir/assets/js/**/*.js']
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        files :[
          {src: 'build/banjir/js/common.js', dest: 'build/banjir/js/common.min.js'},
          {src: 'build/banjir/js/site.js', dest: 'build/banjir/js/site.min.js'},
          {src: "build/banjir/js/map.js", dest: "build/banjir/js/map.min.js"}
        ]
      }
    },
    cssmin: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        keepSpecialComments: false
      },
      build: {
        files: [
           {src: 'build/banjir/css/common.css', dest: 'build/banjir/css/common.min.css'},
           {src: 'build/banjir/css/site.css', dest: 'build/banjir/css/site.min.css'},
           {src: 'build/banjir/css/map.css', dest: 'build/banjir/css/map.min.css'}
        ]
      }
    },
    staticHandlebars: {
      en: {
        files: { 'build/banjir/en/*.html': 'banjir/assets/templates/*.hbs' },
        options: { json: 'banjir/assets/translations/en.json' }
      },

      en_data: {
        files: {'build/banjir/en/data/*.html': 'banjir/assets/templates/data/*.hbs'},
        options: {json: 'banjir/assets/translations/en.json'}
      },

      en_data_v2: {
        files: {'build/banjir/en/data/v2/*.html': 'banjir/assets/templates/data/v2/*.hbs'},
        options: {json: 'banjir/assets/translations/en.json'}
      },

      en_research: {
        files: {'build/banjir/en/research*.html': 'banjir/assets/templates/research/*.hbs'},
        options: {json: 'banjir/assets/translations/en.json'}
      },
      in: {
        files: { 'build/banjir/in/*.html': 'banjir/assets/templates/*.hbs'},
        options: { json: 'banjir/assets/translations/id.json' }
      },
      in_data: {
        files: {'build/banjir/in/data/*.html': 'banjir/assets/templates/data/*.hbs'},
        options: {json: 'banjir/assets/translations/id.json'}
      },
      in_research: {
        files: {'build/banjir/in/research*.html': 'banjir/assets/templates/research/*.hbs'},
        options: {json: 'banjir/assets/translations/id.json'}
      },
      id: {
        files: { 'build/banjir/id/*.html': 'banjir/assets/templates/*.hbs'},
        options: { json: 'banjir/assets/translations/id.json' }
      },
      id_data: {
        files: {'build/banjir/id/data/*.html': 'banjir/assets/templates/data/*.hbs'},
        options: {json: 'banjir/assets/translations/id.json'}
      },
      id_data_v2: {
        files: {'build/banjir/id/data/v2/*.html': 'banjir/assets/templates/data/v2/*.hbs'},
        options: {json: 'banjir/assets/translations/en.json'}
      },
      id_research: {
        files: {'build/banjir/id/research*.html': 'banjir/assets/templates/research/*.hbs'},
        options: {json: 'banjir/assets/translations/id.json'}
      },
    },
    copy: {
      images: {
        expand: true,
        flatten: true,
        files: [
          { expand: true, flatten: true, src: "banjir/assets/img/*", dest: "build/banjir/img/" },
          { expand: true, flatten: true, src: "banjir/vendor/css/images/*", dest: "build/banjir/css/images/" },
          { expand: true, flatten: true, src: "banjir/vendor/fonts/*", dest: "build/banjir/fonts/"},
          { expand: true, flatten: true, src: "banjir/robots.txt", dest: "build/"}
        ]
      },
      // Copy the un-minified JS files into the build directory for development
      // TODO Is there a nicer way to do this where they're not called *.min.js?
      devjs: {
    	  files: [
   	          {src: 'build/banjir/js/common.js', dest: 'build/banjir/js/common.min.js'},
   	          {src: 'build/banjir/js/site.js', dest: 'build/banjir/js/site.min.js'},
	          {src: "banjir/assets/js/analytics.js", dest: "build/banjir/js/analytics.min.js"},
	          {src: "build/banjir/js/map.js", dest: "build/banjir/js/map.min.js"}
    	  ]
      }
    },
    connect: {
      server: {
        options: {
          port: 8000,
          base: 'build',
          keepalive: true
        }
      }
    },
    watch: {
      js: {
        files: 'banjir/assets/js/**/*.js',
        tasks: ['jshint', 'concat:commonJs', 'concat:siteJs', 'concat:mapJs', 'copy:devjs']
      },
      css: {
        files: 'banjir/assets/css/**/*.css',
        tasks: ['concat:commonCss', 'concat:siteCss', 'concat:mapCss', 'cssmin:build']
      },
      templates: {
        files: [
          'banjir/assets/templates/**/*.hbs',
          'banjir/assets/translations/**/*.json'
        ],
        tasks: ['site']
      }
    },
    concurrent: {
      server: ['watch', 'connect'],
      options: {
        logConcurrentOutput: true
      }
    },
    jsdoc: {
      dist: {
        src: 'banjir/assets/js/**.js',
        options: {
          destination: 'docs'
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-static-handlebars');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-jsdoc');

  // Tasks
  grunt.registerTask('assets', ['jshint', 'concat', 'uglify:build', 'cssmin:build', 'copy:images']);
  grunt.registerTask('site', ['staticHandlebars:en', 'staticHandlebars:in', 'staticHandlebars:id', 'staticHandlebars:en_data', 'staticHandlebars:en_data_v2', 'staticHandlebars:in_data', 'staticHandlebars:id_data','staticHandlebars:id_data_v2', 'staticHandlebars:en_research', 'staticHandlebars:in_research', 'staticHandlebars:id_research']);
  grunt.registerTask('server', ['assets', 'site', 'concurrent:server']);
  grunt.registerTask('default', ['assets', 'site']);
  grunt.registerTask('docs', ['jsdoc:dist'])
  grunt.registerTask('dev', ['copy:devjs'])

};
