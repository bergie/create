fs = require 'fs'
{exec, spawn} = require 'child_process'
{series} = require 'async'

sh = (command) -> (k) ->
  console.log "Executing #{command}"
  exec command, (err, sout, serr) ->
    console.log err if err
    console.log sout if sout
    console.log serr if serr
    do k

mergeDirs = (k) ->
  try
    stat = fs.statSync "merged"
  catch e
    fs.mkdirSync "merged"
  series [
    (sh "cp src/*.js merged/")
    (sh "cp src/editingWidgets/*.js merged/")
  ], k

task 'build', 'generate unified JavaScript file for whole Create', ->
  series [
    mergeDirs
    (sh "cat merged/*.js > examples/create.js")
    (sh "rm -r merged")
  ]

task 'min', 'minify the generated JavaScript file', ->
  series [
    mergeDirs
    (sh "cat merged/*.js > examples/create.js")
    (sh "rm -r merged")
    (sh "uglifyjs examples/create.js > examples/create-min.js")
  ]

task 'bam', 'build and minify Create', ->
  invoke 'min'

task 'doc', 'generate documentation for *.coffee files', ->
  sh("docco-husky src") ->

task 'docpub', 'publish API documentation', ->
  series [
    (sh "docco-husky src")
    (sh "mv api api_tmp")
    (sh "git checkout gh-pages")
    (sh "cp -R api_tmp/* api/")
    (sh "git add api/*")
    (sh "git commit -m 'API docs update'")
    (sh "git checkout master")
  ]
