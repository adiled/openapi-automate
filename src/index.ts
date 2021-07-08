const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const _ = require('lodash')
const scaffold = require('./scaffold')

const mapFilename = '.map.json'

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
      endpointPath = endpoint.path.replace(/{(.*?)}/, match => ':'+match.substr(1, match.length - 2) )
      let route = router.route(endpointPath)

      for(var method in endpoint.methods) {
        let name = endpoint.methods[method].operationId

        if(name === undefined) {
          return Error('controller not defined for ' + endpoint.path)
        }

        // detect method i.e operationId change of name under same path
        if(options.scaffold) {
          scaffold.rename(endpoint, method)
        }

        let controllerPath = path.resolve(getPath(name))

        if(!fs.existsSync(controllerPath+'.js')) {
          if(options.scaffold) {
            scaffold.new(name, controllerPath)  
          } else {
            console.warn(`Controller file not found for ${name}.`)
            continue
          }
        }

        // require controller module and link to route
        let handler
        try {
          handler = require(controllerPath)
        }
        catch(e) {
          return Error(`<${name}> controller module failed to load: ${e}`)
        }

        route = route[method](handler)
      }
    }

    return router
  }
}