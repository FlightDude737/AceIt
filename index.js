const hbs = require('hbs')
const fs = require('fs')
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const mysql = require('mysql')

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
  con.query('SELECT * FROM post', (err, result, fields) => {
    if (err) throw err
    if (result == "[]"){
      console.log('empty')
      emptyData = true
    }
  })
})

io.on('connection', (socket) => {
  if (emptyData = true) {
    con.query('SELECT * FROM post', (err, result, fields) => {
      if (err) throw err
      result.forEach((post) => {
        console.log(result[0].name)
        console.log(result[0].title)
        console.log(result[0].message)
        console.log(result[0].rating)
        console.log(result[0].id)
        socket.emit('post-in-socket', post.name, post.title, post.message, post.rating, post.id)
      })
    })
  }
  socket.on('addComment', (num) => {
    io.emit('added-comment', num)
  })
  socket.on('post', (name, title, message, rating, id) => {
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

http.listen(3000, () => {
  console.log('listening...')
})