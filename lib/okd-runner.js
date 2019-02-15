let Store = require('./store')
const _ = require('lodash')

function credentials(){
    let store = new Store()

    let ask = require('bindings')('hello')
    if( store.isEmpty() ) {
       console.log('deploying into cluster')
       let cluster = ask.input('kubernetes/okd host: ')
       let user = ask.input('user: ')
       let password = ask.password('password: ')


       let collection = {cluster, user, password}

       Object.keys(collection).forEach(k => 
        if( _.isUndefine(collection[k]) ) 
            throw `${k} cannot be empty` 
       ) 

       store.save({cluster, user, password})
    }

    return store
}

function spawn_robot({action}) {
    const { fork } = require('child_process');
    const _sleep = require('bindings')('hello').sleep
    let store = credentials()

    const forked   = fork(`${__dirname}/robot`)
    forked.on('message', (msg) => {
        console.log('Message from child', msg);
    });


    configuration  = _.merge( store.configuration, {strictSSL: false, namespace: 'hello'} )
    forked.send( { action, configuration })

    while(true) {
     _sleep(4)
    }

    process.on('exit', () => {
        //Todo...
        console.log('bye...')
    })

    process.exit()
}


function check_args(){
    process.argv.forEach(function (val, index, array) {
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
