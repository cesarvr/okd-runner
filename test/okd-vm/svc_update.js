const login = require('../../okd-api/lib/okd').login
const { delay, errors } = require('./help')
const assert = require('chai').assert
const SVC = require('../lib/helper/svc')

let svc = null
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
            api.namespace('hello')
            okd = api
            svc = new SVC(okd)
        })
        .then(delay)
        .catch(errors)
})

describe('Service Update', function() {
    this.timeout(3000)

    it('testing change_port function', function(){
        assert.isFunction( svc.change_port, 'should exists' )
    }) 

    it('testing port changing', function(){
       return svc.change_port('micro-x', 8084)
            .then(ret => {
                assert.equal(ret.spec.ports[0].targetPort, 8084)
            }) 
    }) 

    it('testing return the port', function(){
       return svc.change_port('micro-x', 8080)
            .then(ret => {
                assert.equal(ret.spec.ports[0].targetPort, 8080)
            }) 
    }) 
}) 
