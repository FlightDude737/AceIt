const hbs = require('hbs')
const fs = require('fs')
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

io.on('connection', (socket) => {
  if (JSON.parse(fs.readFileSync('public/postinfo/posts.json')) !== "[]") {
    var data = JSON.parse(fs.readFileSync('public/postinfo/posts.json'))
    data.forEach((post) => {
      console.log('')
      socket.emit('post-in-socket', post.name, post.title, post.message, post.rating)
    })
  }
  socket.on('addComment', (num) => {
    io.emit('added-comment', num)
  })
  socket.on('post', (name, title, message, rating) => {
    var data = JSON.parse(fs.readFileSync('public/postinfo/posts.json'))
    console.log(data)
    data.push({
      name,
      title,
      message,
      rating
    })
    console.log(data)
    fs.writeFileSync('public/postinfo/posts.json', JSON.stringify(data))
    io.emit('post-in-socket', name, title, message, rating)
  })
})

app.use(express.static('public/images'))
app.set('view engine', 'hbs')
app.set('views', 'public/views')

app.get('/', (req, res) => {
  var data = JSON.parse(fs.readFileSync('public/postinfo/posts.json'))
  res.render('index', {
    reviews: data.length
  })
})

http.listen(3000)