const login = require('okd-api').login
const readline = require('readline-sync')
const Store = require('../store')
const store = new Store()
const  _ = require('lodash')
const byebye = require('../helper/util').byebye


function pick_one(projects){
  index = readline.keyInSelect(projects, `what's your namespace: `)

   if(index === -1) {
    throw 'Namespace required'
  }

  return projects[index]
}

function validate_ns(projects, config) {
  if(_.isUndefined(projects) || _.isEmpty(projects))
    byebye(`Can't find any namespace for this user ${config.user}`)

  return projects
}

function find_all_and_pick(okd, config) {
    return okd.project.all()
              .then(nss => nss.items.map(ns => ns.metadata.name))
              .then(nss => validate_ns(nss, config))
              .then(nss => pick_one(nss, config))
              .then(ns  => {
                okd.namespace(ns).config(cfg => store.save(cfg))
                return okd
              })
}

function choose(config) {
    return login(config)
        .then(okd => {
            if(config.namespace === undefined)
                return find_all_and_pick(okd, config)
            else {
                okd.namespace(config.namespace)
                return okd
            }
        })
}

module.exports = { choose }
