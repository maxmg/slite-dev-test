const net = require('net')

const HOST = 'localhost'
const PORT = 1337

const commandsTemplates = {
  'create'          : /^create:(\w+)$/,
  'insertAtPosition': /^insert:(\w+):(\d+):(\w+)/,  // TODO: merge with 'insert'
  'insert'          : /^insert:(\w+):(\w+)/,
  'delete'          : /^delete:(\w+)$/,
  'get'             : /^get:(\w+)$/,
  'format'          : /^format:(\w+):(\d):(\d):(\w+)$/
}

function parseCommand(command) {
  let args = null
  Object.keys(commandsTemplates).some((key) => {
    let result = command.match(commandsTemplates[key])
    if (result) {
      args = result.slice(1, result.length)
      args.unshift(key)
    }
    return !!result
  })
  return args
}

const server = net.createServer((socket) => {
  socket.on('error', (err) => console.log(err))
  socket.on('data', (data) => {
    let args = parseCommand(data.toString('utf-8'))
    console.log(args)
    socket.write('200\r\n')
  })
})

server.listen(PORT, HOST)