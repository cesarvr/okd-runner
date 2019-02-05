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

       store.save({cluster, user, password})
    }

    return store
}


function check_args(){
    process.argv.forEach(function (val, index, array) {
        if(val === '--cloud' || val === '-c')
        {


            const { fork } = require('child_process');
            const _sleep = require('bindings')('hello').sleep
            let store = credentials()

            const forked   = fork(`${__dirname}/deploy`)

            forked.send(_.merge( store.configuration, {strictSSL: false} ))

            _sleep()

            process.on('exit', () => {
              console.log('boom!')
            })

            process.exit()



        }
    })
}

let init = function(){
    check_args()
}()





module.exports = init
