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