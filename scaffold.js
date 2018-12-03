const fs = require('fs')
const path = require('path')
const _ = require('lodash')

module.exports = {

  mapFilename: '.map.json',

  mapData: null,

  options: null,

  init(endpoints, options) {
    this.options = Object.assign({}, options)

    const endpointsLite = endpoints.map(endpoint => {
      Object.keys(endpoint.methods).forEach(method => {
        endpoint.methods[method] = {operationId: endpoint.methods[method].operationId} 
      })
      return endpoint
    })

    console.log(getPath(this.mapFilename))

    this.mapData = fs.readFileSync(getPath(this.mapFilename), {
      encoding: 'utf-8',
      flag: 'a+'
    })

    if(this.mapData) {
      this.mapData = JSON.parse(this.mapData)
    } else {
      this.mapData = endpointsLite
    }

    console.log(this.mapData)

    fs.writeFileSync(options.controllersDirectory+'/'+this.mapFilename, JSON.stringify(endpointsLite), {flag: 'w'})
  },

  new(name, path) {
    console.info('# Creating controller', name)
    fs.writeFileSync(
      path+'.js',
      `module.exports = (req, res, next) => {\n\n}`,
      {flag: 'wx'}
      )
  },

  rename(endpoint, method) {
    let oldEndpoint = _.find(this.mapData, {path: endpoint.path})
    if (oldEndpoint instanceof Object && oldEndpoint.methods[method]) {
      let oldName = oldEndpoint.methods[method].operationId
      let newName = endpoint.methods[method].operationId
      if (newName !== oldName) {
        console.log('Name is same, renaming')
        fs.renameSync(getPath(`${oldName}.js`), getPath(`${newName}.js`))
      }
    }
  }
}

function getPath(filepath) {
  return path.resolve(module.exports.options.controllersDirectory + '/' + filepath)
}