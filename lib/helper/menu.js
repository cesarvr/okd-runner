const readline = require('readline-sync')
const  _ = require('lodash')

function menu(okd, types, message, _filter) {
    let filter = _filter || _.identity

    let search_all = (types) => {
        let futures = types.map( type => okd[type].all())

        return Promise.all(futures)
                       .then(collections => {
                         return collections.reduce((acc, next) => acc.concat(next.items) ,[])
                       })
    }

    let pick_one = (projects) => {
        index = readline.keyInSelect(projects, `${message} `)

        if(index === -1) {
            throw `Sorry, need an object of type:${type} to continue`
        }

        return projects[index]
    }

    let validate_ns = (projects) => {
        if(_.isUndefined(projects) || _.isEmpty(projects))
            byebye(`Can't find any ${type} for this user`)

        return projects
    }

    let find_all_and_pick = (okd) => {
        return search_all(types) 
            .then(nss => nss.filter(filter))
            .then(nss => nss.map(ns => ns.metadata.name))
            .then(nss => validate_ns(nss))
            .then(nss => pick_one(nss))
    }

    return find_all_and_pick(okd)
}

module.exports = menu
