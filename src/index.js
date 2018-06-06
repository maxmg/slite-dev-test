const net = require('net')

const HOST = 'localhost'
const PORT = 1337

const commandTypes = {
  create          : 'create',
  insertAtPosition: 'insertAtPosition',
  insert          : 'insert',
  delete          : 'delete',
  get             : 'get',
  format          : 'format'
}

const commandsTemplates = {
  [commandTypes.create]          : /^create:(\w+)$/,
  [commandTypes.insertAtPosition]: /^insert:(\w+):(\d+):(\w+)/,  // TODO: merge with 'insert'
  [commandTypes.insert]          : /^insert:(\w+):(\w+)/,
  [commandTypes.delete]          : /^delete:(\w+)$/,
  [commandTypes.get]             : /^get:(\w+)$/,
  [commandTypes.format]          : /^format:(\w+):(\d):(\d):(\w+)$/
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
    
    switch(args[0]) {
      case commandTypes.create:
        break
      case commandTypes.insertAtPosition:
        break
      case commandTypes.insert:
        break
      case commandTypes.delete:
        break
      case commandTypes.get:
        break
      case commandTypes.format:
        break
    }

    socket.write('200\r\n')
  })
})

server.listen(PORT, HOST)