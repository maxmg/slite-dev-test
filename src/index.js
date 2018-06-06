const net = require('net')

const HOST = 'localhost'
const PORT = 1337

const server = net.createServer((socket) => {
  socket.on('error', (err) => console.log(err))
  socket.on('data', (data) => {
    socket.write('200\r\n')
  })
})

server.listen(PORT, HOST)