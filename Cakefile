fs = require 'fs'
{exec, spawn} = require 'child_process'

# deal with errors from child processes
exerr = (err, sout, serr)->
  console.log err if err
  console.log sout if sout
  console.log serr if serr

task 'mergedirs', 'merge source files to one directory', ->
  try
    stat = fs.statSync "merged"
  catch e
    fs.mkdirSync "merged"
  exec "cp src/*.js merged/", exerr
  exec "cp src/editingWidgets/*.js merged/", exerr

task 'build', 'generate unified JavaScript file for whole Create', ->
  invoke 'mergedirs'
  exec "cat merged/*.js > examples/create.js", exerr

task 'min', 'minify the generated JavaScript file', ->
  invoke 'build'
  exec "uglifyjs examples/create.js > examples/create-min.js", exerr

task 'bam', 'build and minify Create', ->
  invoke 'build'
  invoke 'min'
