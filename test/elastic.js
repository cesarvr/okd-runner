const login = require('../../okd-api/lib/okd').login
const { delay, errors } = require('./help')
const assert = require('chai').assert
const Elastic = require('../lib/helper/elastic')

let _attach = null
let okd  = null
let elastic = null

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
            elastic = Elastic(okd, ['dc', 'deploy'])
        })
        .then(delay)
        .catch(errors)
})



describe('Testing Elasic Calls', function() {
    this.timeout(3000)

    it('menu should be a object', function(){
        assert.isObject(elastic,'should be an Object')
    })
    it('Testing search for deployment and deployment configurations' , function() {
        return elastic.all().then(res => {
            let names = res.map(deploy => deploy.metadata.name)
            assert.include(names, 'micro-x', 'It should include this two different type of application')
            assert.include(names, 'boring-app', 'It should include this two different type of application')
        })
    })

    it('using the elastic search by name' , function() {
        return elastic.by_name('boring-app').then(dc => {
            assert.deepInclude(dc, { kind: 'DeploymentConfig'}, 'We expect a DeploymentConfig')
        })
    })

    it('using the elastic search by name (for empty results)' , function() {
        return elastic.by_name('non-boring-app').then(dc => {
            assert.isUndefined(dc, 'should be null')
        })
    })

    it('update replicas of a generics Deployment/DeploymentConfig' , function() {
        this.timeout(10000)
        assert.isFunction(elastic.replace, 'should be a function')
        return  elastic.all().then(components => {
            components.forEach(component => { component.spec.replicas = 2 })
            let promises = components.map(component => elastic.replace(component) )

            return Promise.all(promises)
        }).then(delay.bind(null,5000))
            .then(res => {
                res.forEach(el => assert.equal(el.spec.replicas, 2, 'Replica count should be 2' ) )
            })
    })

    it('update replicas to one' , function() {
        this.timeout(10000)
        assert.isFunction(elastic.replace, 'should be a function')
        return  elastic.all().then(components => {
            components.forEach(component => { component.spec.replicas = 1 })
            let promises = components.map(component => elastic.replace(component) )

            return Promise.all(promises)
        }).then(delay.bind(null,5000))
            .then(res => {
                res.forEach(el => assert.equal(el.spec.replicas, 1, 'Replica count should be 2' ) )
            })
    })


    it('update replicas to none' , function() {
        this.timeout(10000)
        assert.isFunction(elastic.replace, 'should be a function')
        return  elastic.by_name('micro-x').then(obj => {
            obj.spec.replicas = 0

            return elastic.replace(obj)
        }).then(el => {
            assert.equal(el.spec.replicas, 0, 'Replica count should be 2' )
        })

    })
})
