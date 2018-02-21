require('dotenv').config()
const express = require('express')
const mongoClient = require('mongodb').MongoClient
const uri = `mongodb://${process.env.dbusername}:${process.env.dbpassword}@ds163612.mlab.com:63612/urlshortenerproj`
const app = express()

app.use(express.static('public'))

// app.use( (request, response,next)=> {
//   console.log('executes on every request received')
//   next()
// })

//pug template rendering
app.set('view engine', 'pug')
app.set('views', __dirname + '/views' )

//home route, using a string based path
app.get('/', (req,res)=>{
  console.log('get request to /')
  //res.render accepts a template filename (like the pug file) and data called locals
  res.render('index')
})
// app.get( '/new/:longURL((https?:\/\/)?([-a-zA-Z0-9@:%\._\+~#=]{1,256})(\.[a-z]{2,6})(\/[-a-zA-Z0-9@:%_\.\+~#?&\/=]{0,})?)', (req,res)=>{ //parts of url captured and available in req.params object. don't use the actual param name...it only contains the first capture
// console.log( 'route: ', `${req.params[0]}${req.params[1]}${req.params[2]}${req.params[3]}` )

//create shortcode from URL route, using a regex based path
//hyphens and dots interpreted literally by string based paths, so for simplicity just use regular expressions and their capture groups will appear in the req.params object.
app.get( /^(?:\/new\/)(.*)/, (req,res)=>{
  console.log('get request to /new')
  console.log('original URL with query: ', req.originalUrl )
  console.log('captured params from URL, no query', req.params )

  //handle invalid url, this regex wont fail things like 'wwwwwww.poop.com' and 'www.hi.....bob.com'
  let isURLregex = /^(https?:\/\/)?([-~\w\.]{1,256})(\.[a-z]{2,6})(:\d+)?(\/[-~:\w@\.\+#?&\/=]{0,})?$/
  let negateRegex = /(\.{2,}|\/:|\/\/w{4,}|\/\/w{1,2}\.)/ //specify fails to check for separated with with pipes, i.e. alternation
  console.log( req.params[0] )
  console.log( 'valid url check 1/2', isURLregex.test(req.params[0]) )
  console.log( 'valid url check 2/2', !negateRegex.test(req.params[0]) ) //check for repeating dots and other fails
  //handle url failing checks
  if ( !isURLregex.test(req.params[0]) || negateRegex.test(req.params[0]) )
    res.send( { error: 'invalid URL formart' } )
  //handle url passing checks
  else {
    let shortCode

    //connect to the server and do stuff
    mongoClient.connect(uri,(err,client)=>{
      console.log('connected successfully to server')
      //pick database
      const db = client.db('urlshortenerproj')
      //do stuff
      insertDocuments(db,(res)=>{
        console.log(res)
        client.close()
      })
    })

    //reply to request
    res.send( req.originalUrl.slice(5) )
    
  }

})

//support functions
const insertDocuments = (db,callback)=> {
  //insert docs into the documents collection (creates it when adding data if non-existent)
  db.collection('foods')
    .insertMany( [{a:1}, {a:2}], (err,res)=>{
      if (err) console.error(err)
      console.log('inserted 3 documents into the documents collection')
      callback(res)
    })
}

// listen for requests. uncomment line depending on server. choose first for glitch, as the .env files with the port will become available when their site hosts the app. or use the second when running this app locally
// var listener = app.listen(process.env.PORT, function () {
var listener = app.listen( 5000, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})
