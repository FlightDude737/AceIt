const hbs = require('hbs')
const fs = require('fs')
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const mysql = require('mysql')

var serverReload = false

var con = mysql.createConnection({
  host: process.env.HOST,
  database: process.env.DATABASE,
  user: process.env.USER,
  password: process.env.PASSWORD
})

var emptyData = false

con.connect((err) => {
  if (err) throw err;
  console.log('Connected to database.')
  con.query("CREATE TABLE post (name VARCHAR(255), title VARCHAR(255), message VARCHAR(255), rating VARCHAR(255), id VARCHAR(255))", (err, result) => {
    if (err) {
      if (err.sqlMessage == "Table 'post' already exists") {
        console.log("Overriding table creation key...")
        setTimeout(() => {
          console.log("\nOverride complete")
        }, 1000)
      }
    }
  })
  con.query('SELECT * FROM post', (err, result, fields) => {
    if (err) throw err
    if (result == "[]"){
      console.log('empty')
      emptyData = true
    }
  })
})

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
    con.query('SELECT * FROM post', (err, result, fields) => {
      if (err) throw err
      result.forEach((post) => {
        socket.emit('post-in-socket', post.name, post.title, post.message, post.rating, post.id)
      })
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
    var sqlInformation = "INSERT INTO post (name, title, message, rating, id) VALUES ('" + name + "', '" + title + "', '" + message + "', '" + rating + "', '" + id + "')"
    con.query(sqlInformation, (err, result) => {
      if (err) {
        console.log('post')
      }
      console.log('Set post')
    })
    io.emit('post-in-socket', name, title, message, rating, id)
  })
})

app.use(express.static('public/images'))
app.set('view engine', 'hbs')
app.set('views', 'public/views')

app.get('/', (req, res) => {
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
  con.query("SELECT * FROM post WHERE id = '" + req.query.post + "'", (err, result, fields) => {
    delStarVal = result[0].rating
    con.query("DELETE FROM post where id = '" + req.query.post + "'", (err, buffer) => {
      if (err) {
        console.log(err)
      }
      else {
        console.log(result)
        var currRate = data[0].rate
        var newRate = Number(currRate) - result[0].rating
        empty.push({
          comments: (Number(data[0].comments) - 1).toString(),
          rate: (Number(currRate) - result[0].rating).toString()
        })
        var newEmpty = JSON.stringify(empty)
        fs.writeFileSync('public/rating.json', newEmpty)
        console.log("Status: query " + req.query.post + " removed")
        res.send("<script>window.location = '/'</script>")
      }
    })
  })
})

http.listen(3000, () => {
  console.log('listening...')
  setTimeout(() => {
    io.emit('server-update')
  }, 2000)
})