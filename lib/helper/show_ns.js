const login = require('okd-api').login
const readline = require('readline-sync')
const Store = require('../store')
const store = new Store()

function select_ns(okd) {
    return okd.project.all().then(nss => {
        let projects = nss.items.map(ns => ns.metadata.name)
        let index = readline.keyInSelect(projects, 'choose a namespace')

        if(index === -1) { 
            console.log('no namespace selected... closing')
            process.exit()
        }

        okd.namespace(projects[index])
        okd.config(config => store.save(config))

        return okd.namespace(projects[index]) 
    })
}

function choose_namespace(config) {
    return login(config) 
        .then(okd => { 
            if(config.namespace === undefined)
                select_ns(okd)
            else 
                return okd
        })
        .catch(err => console.log('Authentication error: ', err))
}

module.exports = choose_namespace
