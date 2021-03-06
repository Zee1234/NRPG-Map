const express = require('express')
const pug = require('pug')
const fs = require('fs')
const base64 = require('node-base64-image')
const babel = require('babel-core')
const stylus = require('stylus')

const port = 3000

//Storage objects for html, css, js, and svg text
let html = {}
let css = {}
let js = {}

function loadHTML(path,name) {
  html[name] = pug.compile(fs.readFileSync(__dirname+path,"utf8"))
}
//Load SVG into memory as text
let svg = fs.readFileSync(__dirname+'/root/gfx/map.svg',"utf8")
//Load texture overlay into the svg as base64 encoded text
let texture
base64.encode(__dirname+'/root/gfx/texture.png',{
  string: true,
  local: true
}, function(err,ret) {
  if(err) { throw err; }
  texture = 'data:image/png;base64,'+ret
})

//Load CSS into memory as text
function loadCSS(path,name) {
  stylus(fs.readFileSync(__dirname+path,'utf8'))
    .render(function(err,out) {
      if (err) { throw err; }
      css[name] = out
    })
}
//Load javascript into memory as text
function loadJS(path,name) {
  js[name] = fs.readFileSync(__dirname+path,"utf8")
}
//Transforms a string of javascript into using babel-preset-es2015
function babelize(str) {
  return babel.transform(str, {
    presets: ['es2015'],
    comments: false,
  })
}

loadHTML('/root/templates/test.pug','test')
loadHTML('/root/templates/flat.pug','flat')

loadCSS('/root/styles/test.styl','test')

loadJS('/node_modules/svg-pan-zoom/dist/svg-pan-zoom.min.js','svgpanzoom')
loadJS('/node_modules/svg.js/dist/svg.min.js','svgjs')
loadJS('/root/scripts/define_factions.js','definefactions')
loadJS('/root/scripts/define_zones.js','definezones')
loadJS('/root/scripts/initializesvgold.js','initializesvgold')
js.definefactions = babelize(js.definefactions).code
js.definezones = babelize(js.definezones).code
js.initializesvgold = babelize(js.initializesvgold).code

while (!css.test) {}
const app = express()

function serve(path,resp) {
  app.get(path,function(req,res) {
    res.send(resp)
  })
}
function serveCSS(path,resp) {
  app.get(path,function(req,res) {
    res.format({
      css: res.send(resp)
    })
  })
}
function serveHTML(path,resp,locals) {
  app.get(path,function(req,res) {
    res.send(resp(locals))
  })
}
//Serve SVG
serve('/pic/map.svg',svg)

//Serve HTML
serveHTML('/test.html',html.test,{
  svg: svg,
  css: css.test,
  dataurl: texture
})
serveHTML('/flat.html',html.flat,{
  svg: svg,
  svgpanzoom: js.svgpanzoom,
  definefactions: js.definefactions,
  definezones: js.definezones,
  svgjs: js.svgjs,
  initializesvg: js.initializesvgold,
  css: css.test,
  dataurl: texture
})

//Serve CSS
serveCSS('/css/test.css',css.test)

//Serve JS
serve('/js/raphael.min.js',js.raphael)
serve('/js/svg-pan-zoom.min.js',js.svgpanzoom)
serve('/js/svg.js',js.svgjs)
serve('/js/definefactions.js',js.definefactions)
serve('/js/definezones.js',js.definezones)
serve('/js/initializesvg.js',js.initializesvgold)


app.listen(port,function() {
  console.log(`App running on ${port}`)
})
