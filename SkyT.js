// env
require('dotenv').config()

// dependencies
const express = require('express')
//const connectDB = require('./models/Connect')
const app = express()
const port = process.env.SERVER_PORT
//const cluster = require('cluster')
//const numCPUs = require('os').cpus().length

/*
if(cluster.isMaster){
  for(let i=0; i<numCPUs; i++){
    console.log('worker process create')
    cluster.fork()
  } 
}
else{*/
  //connectDB()
  
  const skytiRouter = require('./routes/Router')
  app.use('/skyti', skytiRouter)

  app.use(function(err, req, res, next) {
    res.status(500)
    console.error(err.stack)
    res.send("500 bad")
  })

  app.listen(port, () => {
    console.log('skyti app listening on port ',port)
  })
//}
