const Store = require('./store')
const {setup_workspace} = require('./workspace')
const _ = require('lodash')

function credentials(force){
    let store = new Store()

    let ask = require('bindings')('hello')
    if( store.isEmpty() ) {
       console.log('🚀 0kd-runner')
       console.log('-------------\n')

       let cluster  = ask.input('kubernetes/okd cluster (example: 192.168.64.2:8443): ')
       let user     = ask.input('user: ')
       let password = ask.password('password: ')

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

    let store = credentials()

    const forked   = fork(`${__dirname}/robot`)

    configuration  = _.merge( store.configuration, {strictSSL: false, namespace: 'hello'} )
    forked.send( { action, configuration })

    _sleep(1000)

    process.exit()
}


function check_args(){
    process.argv.forEach(function (val, index, array) {
        let file = process.argv[1]
        setup_workspace(file)

        if(val === '--cloud' || val === '-c')
        {
            spawn_robot({action: 'deploy'})
        }

        if(val === '-rm')
            spawn_robot({action: 'remove'})
    })
}

let init = function(){
    check_args()
}()

module.exports = init
