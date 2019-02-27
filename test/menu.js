const login = require('../../okd-api/lib/okd').login
const { delay, errors } = require('./help')
const assert = require('chai').assert
const menu = require('../lib/helper/menu')

let _attach = null
let okd  = null

before(function() {
    this.timeout(3000)
    return login({
        cluster: 'https://192.168.64.2:8443/',
        user:'user',
        password:'3298432849ueiw',
        strictSSL: false
    })
        .then(api => {
            api.namespace('test')
            okd = api
        })
        .then(delay)
        .catch(errors)
})

describe.skip('Testing Menu', function() {
    this.timeout(3000)

    it('menu should be a function', function(){
        assert.isFunction(menu,'should be a function')
    })
    it('menu should be generated dynamically' , function() {
        return menu(okd, 'deploy', 'Choose your deployment').then(deploy =>{
            console.log('deploy->', deploy)
        })

    })
    it('adding a filter' , function() {
        return menu(okd, 'deploy', 'Choose your deployment', d => d.metadata.name !== 'sleep' ).then(deploy =>{
            console.log('deploy->', deploy)
        })
    })



})

