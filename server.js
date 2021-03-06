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
  // console.log( 'valid url check 1/2', isURLregex.test(inputURL) )
  // console.log( 'valid url check 2/2', !negateRegex.test(inputURL) ) //check for repeating dots and other fails
  
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
      //scoped variables
      const maxAttempts = 50
      let currentAttempt = 0, shortCode

      //functions
      //fn to reply to request
      const reply = (shortCode)=>{
        shortCode ?
        (
          res.send(`URL saved, use code ${shortCode}`)
        ) :
        (
          res.send('server error: shortcode could not be made')
        )
      }

      //code generation fn to return a shortcode
      const makeCode = ()=> String( Math.random() ).slice(2,7)//gets a string of 0-9 digits of length defined by call to slice

      //insert document fn
      const insertDoc = ()=> {
        db.collection('url_shortcodes')
            .insertMany( [ {'URL':inputURL, 'code':shortCode} ], (err,res)=>{
              if (err) console.error(err)
              console.log('inserted 1 document into url_shortcodes collection')
              // console.log('operation result: ', res)
              client.close()
              reply(shortCode)
            })
      }

      //check if document in collection with same shortcode fn
      const checkIfExists = ()=>{
        //search for docs in collection with the same code
        db.collection('url_shortcodes')
          .count( { code:{ $eq:shortCode } }, {limit:1}, (err,result)=>{ //the limit option is for performance, to stop counting after finding one doc. the result in the callback will be a number
            if (err) console.error(err)
            console.log('docs found with same code: ', result)
            //handle submission or regen
            if (result===0){
              insertDoc()
            }
            else{
              currentAttempt++
              shortCode = makeCode()
              console.log('new shortCode: ', shortCode)
              //recursive calls to this same fn until a free code is found, or exit with fail if max attempts reached, which may indicate all codes used, or the nature of your random code was not able to find an unused shortcode within the maximum attempt limits
              if(currentAttempt<maxAttempts) checkIfExists()
              else{
                console.log('max attempts to find an unused code reached. all or.... too many codes have been used. check db to confirm which case')
                client.close()
                reply()
              }
            }
          })
      }

      //initialization
      //insert document with a new code every time.
      shortCode = makeCode()
      console.log('trying shortCode: ', shortCode)
      checkIfExists()
      
    })

  }

})

//redirect to website when request with shortcode received
app.get( /^\/(\d{5})$/, (req,res)=>{
  console.log('get request to /#####')
  console.log('received code: ', req.params[0])
  
  //connect to the server and do stuff
  mongoClient.connect(uri,(err,client)=>{
    console.log('connected successfully to mLab server')
    //pick database, assign to a variable to use with command operations
    const db = client.db('urlshortenerproj')
  
    //search for docs in collection with the same code
    db.collection('url_shortcodes')
      .findOne( { code:{ $eq: req.params[0] } }, (err,result)=>{ //result in callback will be the found object
        if (err) console.error(err)
        result ?
        (
          console.log('doc found with same code: ', result),
          res.redirect( result.URL )
        ):(
          console.log('code not assigned'),
          res.send('code not assigned')
        )
        client.close()
      })
  
  })

})

// listen for requests. glitch hosting will also provide a hidden .env with a port to use, but you can set it youself
var listener = app.listen( 5000, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})
