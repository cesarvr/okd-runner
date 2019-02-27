const Store = require('./store')
const {setup_workspace} = require('./workspace')
const _ = require('lodash')

function credentials(force){
    let store = new Store()
    store.hide()


    const readline = require('readline-sync')
    if( store.isEmpty() ) {
       console.log('🚀 0kd-runner')

       let cluster  = readline.question('kubernetes/okd cluster (example: 192.168.64.2:8443): ')
       let user     = readline.question('user: ')
       let password = readline.question('password: ', {hideEchoBack: true })
       console.log('\n')
       let collection = {cluster, user, password}

       Object.keys(collection).forEach(k => {
        if( _.isUndefined(collection[k]) )
            throw `${k} cannot be empty`
       })

       store.save({cluster, user, password})
    }

    return store
}

function spawn_robot({action}) {
    const { fork } = require('child_process')
    const _sleep = require('bindings')('hello').sleep
    const { did_child_finish } = require('./helper/util')

    let store = credentials()

    const forked   = fork(`${__dirname}/robot`)
    let configuration  = _.merge( store.configuration, {strictSSL: false} )

    forked.send( { action, configuration })

    forked.on('message', (msg) => {
      console.log('Message from child', msg);
      process.exit()
    })

    while(true) {
      let child_state = did_child_finish()
      if( did_child_finish() ) {
        console.log('\n \x1b[0;37;31m bye 🍺  \n')
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
    process.argv.forEach(function (val, index, array) {
        if(val === '--cloud' || val === '-c') {
            spawn_robot({action: 'deploy'})
        }

        if(val === '--attach' || val === '-a') {
            spawn_robot({action: 'attach'})
        }

        if(val === '--detach' || val === '-d') {
            spawn_robot({action: 'detach'})
        }

        if(val === '--remove' || val === '-rm') {
            spawn_robot({action: 'remove'})
        }
    })
}

let init = function(){
    check_args()
}()

module.exports = init
