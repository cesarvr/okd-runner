const login = require('okd-api').login
const readline = require('readline-sync')
const Store = require('../store')
const store = new Store()
const  _ = require('lodash')

function byebye(message){
  console.error(message)
  process.exit(1)
}

function ask_namespace1(projects){
  index = readline.keyInSelect(projects, `what's your namespace: `)
  if(index === -1)
    byebye('No namespace selected, exiting...')

  return projects[index]
}

function ask_namespace(projects, config) {
  let total = 0


  projects.forEach(project => {
    console.log(`${total}: ${project}`)
    total++
  })

  let ask     = require('bindings')('hello')
  let select  = ask.input(`select your namespace: (i.e., 0 or ${projects[0]} ): `)

  if(projects.indexOf(select) >= 0 ){
    let index = projects.indexOf(select)
    return projects[index]
  }

  if(!_.isUndefined(projects[select])){
    return projects[select]
  }

  ask_namespace(projects, config)
}

function validate_ns(projects, config) {
  if(_.isUndefined(projects) || _.isEmpty(projects))
    byebye(`Can't find any namespace for this user ${config.user}`)

  return projects
}

function select_ns(okd, config) {
    return okd.project.all()
              .then(nss => nss.items.map(ns => ns.metadata.name))
              .then(nss => validate_ns(nss, config))
              .then(nss => ask_namespace1(nss, config))
              .then(ns  => {
                okd.namespace(ns).config(cfg => store.save(cfg))
                return okd
              })
}

function choose_namespace(config) {
    process.on('SIGINT', function() {
        process.exit()
    })

    return login(config)
        .then(okd => {
            if(config.namespace === undefined)
                return select_ns(okd, config)
            else {
                okd.namespace(config.namespace)
                return okd
            }
        })
}

module.exports = choose_namespace
