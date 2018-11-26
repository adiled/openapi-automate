const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const _ = require('lodash')

function scaffoldController(name, path) {
  console.info('# Creating controller', name)
  fs.writeFileSync(
    path+'.js',
    `module.exports = (req, res, next) => {\n\n}`,
    {flag: 'wx'}
    )
}

function updateMapFile(dir, data) {
  fs.writeFileSync(dir+'/_map.json', data, {flag: 'w'})
}


module.exports = {

  getRouter(router, filepath, ops = {}) {

    const options = Object.assign({
      scaffold: true,
      controllersDirectory: './controllers'
    }, ops)

    function getPath(path) {
      return options.controllersDirectory + '/' + path
    }

    try {
      var spec = yaml.safeLoad(fs.readFileSync(filepath, 'utf8'))
    } catch (e) {
      return Error(e)
    }

    const endpoints = Object.keys(spec.paths).map(endpoint => {
      return {
        path: endpoint,
        methods: spec.paths[endpoint]
      }
    })

    const endpointsLite = endpoints.map(endpoint => {
      Object.keys(endpoint.methods).forEach(method => {
        endpoint.methods[method] = {operationId: endpoint.methods[method].operationId} 
      })
      return endpoint
    })
    

    let oldEndpoints = fs.readFileSync(getPath('_map.json'), {
      encoding: 'utf-8',
      flag: 'a+'
    })

    if(oldEndpoints) {
      oldEndpoints = JSON.parse(oldEndpoints)
    } else {
      oldEndpoints = endpointsLite
    }

    updateMapFile(options.controllersDirectory, JSON.stringify(endpointsLite))

    // create routes
    for(let key in endpoints) {

      let endpoint = endpoints[key]
      let oldEndpoint = _.find(oldEndpoints, {path: endpoint.path})

      let route = router.route(endpoint.path)

      for(var method in endpoint.methods) {
        let name = endpoint.methods[method].operationId

        if(name === undefined) {
          return Error('controller not defined for ' + endpoint.path)
        }

        if (oldEndpoint instanceof Object && oldEndpoint.methods[method]) {
          let oldName = oldEndpoint.methods[method].operationId
          if (name !== oldName) {
            console.log('Name is same, renaming')
            fs.renameSync(getPath(`${oldName}.js`), getPath(`${name}.js`))
          }
        }

        let filepath = getPath(name)
        let handler

        try {
          handler = require(path.resolve(filepath))
        }

        catch(e) {

          // console.log(e)

          if(!options.scaffold || e.code !== 'MODULE_NOT_FOUND') {
            return Error(e)
          }

          scaffoldController(name, filepath)
          handler = require(path.resolve(filepath))
        }

        route = route[method](handler)
      }
    }

    return router
  }
}