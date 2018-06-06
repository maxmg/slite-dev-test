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
  [commandTypes.create]          : /^create:(\w+)\n$/s,
  [commandTypes.insertAtPosition]: /^insert:(\w+):(\d+):(.+)\n$/s,  // TODO: merge with 'insert'
  [commandTypes.insert]          : /^insert:(\w+):(.+)\n$/s,
  [commandTypes.delete]          : /^delete:(\w+)\n$/s,
  [commandTypes.get]             : /^get:(\w+):(\w+)\n$/s,
  [commandTypes.format]          : /^format:(\w+):(\d+):(\d+):(\w+)\n$/s
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

var notesStorage = (() => {
  this.notes = {}
  this.create = (noteId) => {
    this.notes[noteId] = []
    return true
  }
  this.get = (noteId) => {
    if (!this.notes[noteId]) return false
    return this.notes[noteId]
  }
  this.commit = (noteId, action) => {
    if (!this.notes[noteId]) return false
    this.notes[noteId].push(action)
    return true
  }
  this.delete = (noteId) => {
    if (!this.notes[noteId]) return false
    delete this.notes[noteId]
    return true
  }
  return this
})()

const server = net.createServer((socket) => {
  socket.on('error', (err) => console.log(err))
  socket.on('data', (data) => {
    let response = 404
    let args = parseCommand(data.toString('utf-8'))
    
    if (args) {
      let noteId = args[1]
      switch(args[0]) {
        case commandTypes.create:
          notesStorage.create(noteId)
          response = 200
          break
        case commandTypes.insertAtPosition:
        case commandTypes.insert:
        case commandTypes.format:
          if (notesStorage.commit(noteId, args)) {
            response = 200
          }
          break
        case commandTypes.delete:
          if (notesStorage.delete(args[1])) {
            response = 200
          }
          break
        case commandTypes.get:
          let note = notesStorage.get(args[1])
          if (note) {
            response = note.length ? note : ''
          }
          break
      }      
    }

    socket.write(`${response}\r\n`)
  })
})

server.listen(PORT, HOST)