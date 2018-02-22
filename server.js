require('dotenv').config()
const express = require('express')
const mongoClient = require('mongodb').MongoClient
const uri = `mongodb://${process.env.dbusername}:${process.env.dbpassword}@ds163612.mlab.com:63612/urlshortenerproj`
const app = express()

app.use(express.static('public'))

//pug template rendering
app.set('view engine', 'pug')
app.set('views', __dirname + '/views' )

//home route, using a string based path
app.get('/', (req,res)=>{
  console.log('get request to /')
  //res.render accepts a template filename (like the pug file) and data called locals
  res.render('index')
})

//create shortcode from URL received in request URL, using a regex based path
//hyphens and dots interpreted literally by string based paths, so for simplicity just use regular expressions and their capture groups will appear in the req.params object.
app.get( /^(?:\/new\/)(.{1,})/, (req,res)=>{
  console.log('get request to /new')
  // console.log('original URL with query: ', req.originalUrl )
  // console.log('captured params from URL, no query', req.params )
  
  //check url
  let isURLregex = /^(https?:\/\/)([-~\w\.]{1,256})(\.[a-z]{2,6})(:\d+)?(\/[-~:\w@\.\+#?&\/=]{0,})?$/
  let negateRegex = /(\.{2,}|\/:|\/\/w{4,}|\/\/w{1,2}\.)/ //specify fails to check for separated with with pipes, i.e. alternation
  let inputURL = req.params[0]
  console.log( 'valid url check 1/2', isURLregex.test(inputURL) )
  console.log( 'valid url check 2/2', !negateRegex.test(inputURL) ) //check for repeating dots and other fails
  
  //handle failing url
  if ( !isURLregex.test(inputURL) || negateRegex.test(inputURL) )
    res.send( { error: 'invalid URL formart' } )
  //handle passing url
  else {
    //connect to the server and do stuff
    mongoClient.connect(uri,(err,client)=>{
      console.log('connected successfully to mLab server')
      //pick database, assign to a variable to use with command operations
      const db = client.db('urlshortenerproj')
      //make a shortcode that is not used in the collection already
      let shortCode = String( Math.random() ).slice(2,3)//gets a string of 0-9 digits of length defined by call to slice
      // console.log(shortCode)
      //search for docs in collection with the same code
      let searchResults
      db.collection('url_shortcodes')
        // .find( { code:{ $eq:shortCode } } )
        // .find({})
        .count( { code:{ $eq:shortCode } }, (err,result)=>{
          if (err) console.error(err)
          console.log('found with same code: ', result)
        })
        // .toArray((err, docsArr)=>{
        //   if (err) console.error(err)
        //   searchResults = docsArr
        // })
      console.log('results of .find()', searchResults)

      //insert docs into the documents collection (creates the collection when adding docs if non-existent)
      db.collection('url_shortcodes')
        .insertMany( [ {'URL':inputURL, 'code':shortCode} ], (err,res)=>{
          if (err) console.error(err)
          console.log('inserted 1 document into url_shortcodes collection')
          console.log('operation result: ', res)
          client.close()
        })
    })

    //reply to request
    res.send( req.originalUrl.slice(5) )

  }

})

// listen for requests. uncomment line depending on server. choose first for glitch, as the .env files with the port will become available when their site hosts the app. or use the second when running this app locally
// var listener = app.listen(process.env.PORT, function () {
var listener = app.listen( 5000, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})
