const Store = require('./store')
const {setup_workspace} = require('./workspace')
const _ = require('lodash')
const args = require('./helper/args')

function credentials(){
    let store = new Store()
    store.hide()

    const readline = require('readline-sync')

    if( store.isEmpty() ) {
       console.log('okd-runner 1.11')

       let cluster   = readline.question('kubernetes/okd cluster (example: 192.168.64.2:8443): ')
       let user      = readline.question('user: ')
       let password  = readline.question('password: ', {hideEchoBack: true })
       let namespace = readline.question('namespace: ')

       console.log('\n')
       let collection = {cluster, user, password, namespace}

       Object.keys(collection).forEach(k => {
        if( _.isUndefined(collection[k]) )
            throw `${k} cannot be empty`
       })

       store.save(collection)
    }

    return store
}

function spawn_robot(cmd) {
    const { fork } = require('child_process')
    const _sleep = require('bindings')('blocking').sleep
    const { did_child_finish } = require('./helper/util')

    let store = credentials()

    const forked   = fork(`${__dirname}/robot`)
    let configuration  = _.merge( store.configuration, { strictSSL: false } )

    forked.send(cmd)

    while(true) {
      let child_state = did_child_finish()
      if( child_state ) {
        process.exit()
      } else {
        _sleep(1)
      }
    }

    process.exit()
}


function check_args(){
    let file = process.argv[1]
    setup_workspace(file)
    let cmd = null
    try{
      cmd = args(process.argv)
      spawn_robot(cmd)
    }catch(error){
        console.error(error)    
        process.exit()
    }
}

let init = function(){
    check_args()
}()

module.exports = init
