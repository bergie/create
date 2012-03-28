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
