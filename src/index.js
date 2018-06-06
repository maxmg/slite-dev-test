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
  [commandTypes.create]          : /^create:(\w+)/,
  [commandTypes.insertAtPosition]: /^insert:(\w+):(\d+):(\w+)/,  // TODO: merge with 'insert'
  [commandTypes.insert]          : /^insert:(\w+):(\w+)/,
  [commandTypes.delete]          : /^delete:(\w+)/,
  [commandTypes.get]             : /^get:(\w+):(\w+)/,
  [commandTypes.format]          : /^format:(\w+):(\d):(\d):(\w+)/
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
    let response = 404
    let args = parseCommand(data.toString('utf-8'))

    if (args) {
      switch(args[0]) {
        case commandTypes.create:
          response = 200
          break
        case commandTypes.insertAtPosition:
        case commandTypes.insert:
        case commandTypes.format:
          response = 200
          break
        case commandTypes.delete:
          response = 200
          break
        case commandTypes.get:
          response = 200
          break
      }      
    }

    socket.write(`${response}\r\n`)
  })
})

server.listen(PORT, HOST)