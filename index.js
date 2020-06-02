const hbs = require('hbs')
const fs = require('fs')
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const nodemailer = require('nodemailer')
const os = require('os')

var serverReload = false

var transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  }
})

var mailOptions = {
  from: "AceIT <aceairofficial@gmail.com>",
  to: "andrewdc@madisoncity.k12.al.us, benlovesplanes@gmail.com, drewcrocker23@gmail.com",
  subject: 'Someone left a comment on AceIT!',
  html: "This is an email alert that someone has left a comment on AceIt!<br>Check it out at <a href='https://aceit.flightdude737.repl.co'>Visit AceIT to see feedback.</a>"
}

var emptyData = false

io.on('connection', (socket) => {
  var ratingInfo = JSON.parse(fs.readFileSync('public/rating.json'))
  if (ratingInfo[0].comments == "0"){
    socket.emit('return-rating', 'nocomments')
  } else {
    var offRating = Math.round(Number(ratingInfo[0].rate) / Number(ratingInfo[0].comments)).toString()
    var offComments = ratingInfo[0].comments
    socket.emit('return-rating', offRating)
  }
  if (emptyData = true) {
    var allPosts = JSON.parse(fs.readFileSync('public/posts/posts.json'))
    allPosts.forEach((post) => {
      socket.emit('post-in-socket', post.name, post.title, post.message, post.rating, post.id)
    })
  }
  socket.on('addComment', (num) => {
    io.emit('added-comment', num)
  })
  socket.on('post', (name, title, message, rating, id) => {
    var data = JSON.parse(fs.readFileSync('public/rating.json'))
    var emptydata = []
    var comments = (Number(data[0].comments) + 1).toString()
    var vanrate = Number(data[0].rate) + Number(rating)
    var rate = vanrate
    emptydata.push({
      comments,
      rate
    })
    fs.writeFileSync('public/rating.json', JSON.stringify(emptydata))
    var postData = JSON.parse(fs.readFileSync('public/posts/posts.json'))
    postData.push({
      name,
      title,
      message,
      rating,
      id
    })
    fs.writeFileSync('public/posts/posts.json', JSON.stringify(postData))
    io.emit('post-in-socket', name, title, message, rating, id)
    transport.sendMail(mailOptions, (err, response) => {
      if (err) throw err
      console.log('Email sent.')
    })
  })
})

app.use(express.static('public/images'))
app.set('view engine', 'hbs')
app.set('views', 'public/views')

app.get('/', (req, res) => {
  res.redirect('/ace-application')
})

app.get('/ace-application', (req, res) => {
  res.render('index', {
    reviews: 0
  })
})

app.get('/remove', (req, res) => {
  var data = JSON.parse(fs.readFileSync('public/rating.json'))
  var value = (Number(data[0].comment) - 1).toString()
  var empty = []
  var delStarVal = 0
  var rating = data[0].rate
  var postData = JSON.parse(fs.readFileSync('public/posts/posts.json'))
  var index = -1
  var dataIndex = 0
  postData.forEach((post) => {
    index++
    if (post.id === req.query.post) {
      dataIndex = index
      var currRate = data[0].rate
      var newRate = Number(currRate) - postData[index].rating
      empty.push({
        comments: (Number(data[0].comments) - 1).toString(),
        rate: (Number(currRate) - postData[index].rating).toString()
      })
      var newEmpty = JSON.stringify(empty)
      fs.writeFileSync('public/rating.json', newEmpty)
      console.log("Status: query " + req.query.post + " removed")
      postData.splice(dataIndex, 1)
      fs.writeFileSync('public/posts/posts.json', JSON.stringify(postData))
      res.send("<script>window.location = '/'</script>")
    }
  })
  /*con.query("SELECT * FROM post WHERE id = '" + req.query.post + "'", (err, result, fields) => {
    delStarVal = result[0].rating
    con.query("DELETE FROM post where id = '" + req.query.post + "'", (err, buffer) => {
      if (err) {
        console.log(err)
      }
      else {
        console.log(result)
        
      }
    })
  })*/
})

app.get('*', (req, res) => {
  res.send("404 error. The server could not find the requested endpoint.")
})

http.listen(3000, () => {
  console.log('listening...')
})