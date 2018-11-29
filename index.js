const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const _ = require('lodash')
const scaffold = require('./scaffold')

const mapFilename = '.map.json'

function scaffoldController(name, path) {
  console.info('# Creating controller', name)
  fs.writeFileSync(
    path+'.js',
    `module.exports = (req, res, next) => {\n\n}`,
    {flag: 'wx'}
    )
}

const defaultOptions = {
  scaffold: true,
  controllersDirectory: './controllers'
}

module.exports = {

  /* 
  * add routes to passed router from swagger spec passed via filepath
  */

  get(router, filepath, ops = {}) {

    const options = Object.assign(defaultOptions, ops)

    function getPath(path) {
      return options.controllersDirectory + '/' + path
    }

    // load yaml to spec object
    try {
      var spec = yaml.safeLoad(fs.readFileSync(filepath, 'utf8'))
    } catch (e) {
      return Error(e)
    }

    // get endpoint objects from spec
    const endpoints = Object.keys(spec.paths).map(endpoint => ({
      path: endpoint,
      methods: spec.paths[endpoint]
    }))

    if(options.scaffold) {
      scaffold.init(endpoints, options)
    }

    // create routes from endpoint objects
    for(let key in endpoints) {

      let endpoint = endpoints[key]
      let route = router.route(endpoint.path)

      for(var method in endpoint.methods) {
        let name = endpoint.methods[method].operationId

        if(name === undefined) {
          return Error('controller not defined for ' + endpoint.path)
        }

        // detect method i.e operationId change of name under same path
        if(options.scaffold) {
          scaffold.rename(endpoint, method)
        }

        let controllerPath = getPath(name)
        let handler

        // get controller and link to route
        try {
          handler = require(path.resolve(controllerPath))
        }
        catch(e) {

          if(!options.scaffold || e.code !== 'MODULE_NOT_FOUND') {
            return Error(e)
          }

          scaffold.new(name, controllerPath)
          handler = require(path.resolve(controllerPath))
        }

        route = route[method](handler)
      }
    }

    return router
  }
}