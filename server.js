require('dotenv').config()
const express = require('express')
const app = express()

app.use(express.static('public'))

// app.use( (request, response,next)=> {
//   console.log('executes on every request received')
//   next()
// })

app.get("/", (request, response)=> {
  console.log('get request to /')
  console.log(process.env.hi)
  response.end('home')
})

//pug template rendering
app.set('view engine', 'pug')
app.set('views', __dirname + '/views' )
app.get('/pugrender', (req,res)=>{
  console.log('get request to /pugrender')
  //res.render accepts a template filename (like the pug file) and data called locals
  res.render('index', {date: new Date().toDateString()} )
})

// listen for requests. uncomment line depending on server. choose first for glitch, as the .env files with the port will become available when their site hosts the app. or use the second when running this app locally
// var listener = app.listen(process.env.PORT, function () {
var listener = app.listen( 5000, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})
