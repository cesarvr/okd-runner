const fs = require('fs')

const pid_file = './.killme'


function byebye(message){
  console.error(message)
  process.send({ msg: 'bye' });
  fs.writeFileSync(pid_file, `${process.pid}`)
  process.exit()
}

function did_child_finish(){
  if (fs.existsSync(pid_file)) {
    fs.unlinkSync(pid_file)
    return true
  }
  return false
}

function fail(response) {
    return {
        fail: (cb) => {
            if(response === undefined )
                cb()
        }}
}

function response(response) {
    return {
        ok: (cb) => {
            if(response !== undefined)
                cb(response)
            return fail(response)
        }
    }
}


module.exports = { byebye, did_child_finish, fail, response }
