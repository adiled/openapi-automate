express-router-swagger provides an express router with swagger paths as routes while also scaffolding the controllers.

# Usage

Install the package:

> npm install --save express-router-swagger

Example code:

```javascript

const express = require('express')
const swaggerRouter = require('express-router-swagger')

let app = express()

let router = express.Router()
router = swaggerRouter.get(router, './swagger-spec.yml')

if (router instanceof Error) {
  throw router
}

app.use(router)

```

Disable scaffolding (recommended in production)

```javascript

swaggerRouter.get(router, './swagger-spec.yml', {
  scaffold: false
  })

```

## Methods

`get(Router router, String filepath, [Object ops])`

Returns: Router

##### router
A valid instance of express.Router

##### filepath
Path to the swagger yaml specification file

##### ops
(Optional) config object

## ops Parameters

`scaffold` (Boolean) toggle controller scaffolding
Default: true

`controllersDirectory` (String) 
Default: 'controllers'


