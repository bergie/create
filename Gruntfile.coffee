module.exports = ->
  banner = """/* Create.js <%= pkg.version %> - Inline editing toolkit
by Henri Bergius and contributors. Available under the MIT license.
See http://createjs.org for more information
*/"""

  # Project configuration
  @initConfig
    pkg: @file.readJSON 'package.json'

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
        dest: 'examples/create.js'
      edit:
        src: [
          'src/jquery.Midgard.midgardEditable.js'
          'src/jquery.Midgard.midgardStorage.js'
          'src/collectionWidgets/*.js'
          'src/editingWidgets/*.js'
        ]
        dest: 'examples/create-editonly.js'

    # JavaScript minification
    uglify:
      options:
        banner: banner
        report: 'min'
      full:
        files:
          'examples/create.min.js': ['examples/create.js']
      edit:
        files:
          'examples/create-editonly.min.js': ['examples/create-editonly.js']


    # Coding standards verification
    jshint:
      all: ['src/*.js', 'src/**/*.js', 'locale/*.js']

    # Unit tests
    qunit:
      all: ['test/*.html']

  # Build dependencies
  @loadNpmTasks 'grunt-contrib-concat'
  @loadNpmTasks 'grunt-contrib-uglify'

  # Testing dependencies
  @loadNpmTasks 'grunt-contrib-jshint'
  @loadNpmTasks 'grunt-contrib-qunit'

  # Local tasks
  @registerTask 'build', ['concat:full', 'uglify:full']
  @registerTask 'editonly', ['concat:edit', 'uglify:edit']
  @registerTask 'test', ['jshint', 'build', 'qunit']
