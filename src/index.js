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

/** PARSING COMMANDS */

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

/** STORAGE */

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

/** RENDERING NOTES */

const stylingTags = {
  italic: { md: '*', txt: '' },
  bold:   { md: '**', txt: '' }
}

var notesBuilder = (() => {

  this.aggregate = (commits, format) => {
    let output = ''
    let formatOffsetsByPosition = {}

    commits.forEach((commit) => {
      switch(commit[0]) {
        case commandTypes.insertAtPosition:
        case commandTypes.insert:
          let position = commit[0] === commandTypes.insertAtPosition ? parseInt(commit[2], 10) : output.length
          let text     = commit[0] === commandTypes.insertAtPosition ? commit[3] : commit[2]
          
          output = this.insertAtPosition(
            output,
            text,
            this.getPositionAwareOfFormat(position, formatOffsetsByPosition)
          )
          break

        case commandTypes.format:
          let positionStart = parseInt(commit[2], 10)
          let positionEnd   = parseInt(commit[3], 10)
          let style         = commit[4]
          let stylingTag    = stylingTags[style][format]
          let positions     = [positionStart, positionEnd]
          
          positions.forEach((position) => {
            output = this.insertAtPosition(
              output,
              stylingTag,
              this.getPositionAwareOfFormat(position, formatOffsetsByPosition)
            )
            if (!formatOffsetsByPosition[position]) {
              formatOffsetsByPosition[position] = stylingTag.length
            } else {
              formatOffsetsByPosition[position] += stylingTag.length
            }
          })
          break
      }
    })

    return output
  }

  this.insertAtPosition = (content, text, position) => {
    return content.substring(0, position) + text + content.substring(position, content.length)
  }

  this.getPositionAwareOfFormat = (position, positionOffsets) => {
    let positionsWithFormat = Object.keys(positionOffsets)
    positionsWithFormat.sort()

    let offset = 0
    for (var i = 0; i < positionsWithFormat.length; i++) {
      if (positionsWithFormat[i] > position) break
      offset += positionOffsets[positionsWithFormat[i]]
    }
    return position + offset
  }
  return this
})()

/** SERVER */

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
          let note   = notesStorage.get(args[1])
          let format = args[2]
          if (note) {
            response = notesBuilder.aggregate(note, format)
          }
          break
      }      
    }

    socket.write(`${response}\r\n`)
  })
})

server.listen(PORT, HOST)