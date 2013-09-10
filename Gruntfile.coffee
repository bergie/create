module.exports = ->
  banner = """/* Create.js <%= pkg.version %> - Inline editing toolkit
by Henri Bergius and contributors. Available under the MIT license.
See http://createjs.org for more information
*/"""

  # Project configuration
  @initConfig
    pkg: @file.readJSON 'package.json'

    # Install dependencies
    bower:
      install: {}

    # Build setup: concatenate source files
    concat:
      options:
        stripBanners: true
        banner: banner
      full:
        src: [
          'src/*.js'
          'src/**/*.js'
          'locale/*.js'
        ]
        dest: 'dist/create.js'
      edit:
        src: [
          'src/jquery.Midgard.midgardEditable.js'
          'src/jquery.Midgard.midgardStorage.js'
          'src/collectionWidgets/*.js'
          'src/editingWidgets/*.js'
        ]
        dest: 'dist/create-editonly.js'

    # JavaScript minification
    uglify:
      options:
        banner: banner
        report: 'min'
      full:
        files:
          'dist/create.min.js': ['dist/create.js']
      edit:
        files:
          'dist/create-editonly.min.js': ['dist/create-editonly.js']


    # Coding standards verification
    jshint:
      all: ['src/*.js', 'src/**/*.js', 'locale/*.js']

    # Unit tests
    qunit:
      all: ['test/*.html']

    # Cross-browser testing
    connect:
      server:
        options:
          base: ''
          port: 9999

    'saucelabs-qunit':
      all:
        options:
          urls: ['http://127.0.0.1:9999/test/index.html']
          browsers: [
              browserName: 'chrome'
            ,
              browserName: 'safari'
              platform: 'OS X 10.8'
              version: '6'
            ,
              browserName: 'opera'
            ,
              browserName: 'internet explorer'
              platform: 'WIN8'
              version: '10'
          ]
          build: process.env.TRAVIS_JOB_ID
          testname: 'Create.js cross-browser tests'
          tunnelTimeout: 5
          concurrency: 3
          detailedError: true

  # Dependency installation
  @loadNpmTasks 'grunt-bower-task'

  # Build dependencies
  @loadNpmTasks 'grunt-contrib-concat'
  @loadNpmTasks 'grunt-contrib-uglify'

  # Testing dependencies
  @loadNpmTasks 'grunt-contrib-jshint'
  @loadNpmTasks 'grunt-contrib-qunit'

  # Cross-browser testing
  @loadNpmTasks 'grunt-contrib-connect'
  @loadNpmTasks 'grunt-saucelabs'

  # Local tasks
  @registerTask 'build', ['concat:full', 'uglify:full']
  @registerTask 'editonly', ['concat:edit', 'uglify:edit']
  @registerTask 'test', ['jshint', 'build', 'qunit']
  @registerTask 'crossbrowser', ['test', 'connect', 'saucelabs-qunit']
