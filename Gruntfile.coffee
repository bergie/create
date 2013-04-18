module.exports = ->
  # Project configuration
  @initConfig
    pkg: @file.readJSON 'package.json'

    # Build setup: concatenate source files
    concat:
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
        banner: '/* Create.js <%= pkg.version %> - Inline editing toolkit. See http://createjs.org for more information */'
        report: 'min'
      full:
        files:
          'examples/create.min.js': ['examples/create.js']
      edit:
        files:
          'examples/create-editonly.min.js': ['examples/create-editonly.js']

  # Build dependencies
  @loadNpmTasks 'grunt-contrib-concat'
  @loadNpmTasks 'grunt-contrib-uglify'

  # Local tasks
  @registerTask 'build', ['concat:full', 'uglify:full']
  @registerTask 'editonly', ['concat:edit', 'uglify:edit']
