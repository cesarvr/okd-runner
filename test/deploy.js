var login = require('../../okd-api/lib/okd').login
const Deployment = require('../lib/okd/deployment')
const assert = require('chai').assert
const {delay, delayFor, errors} = require('./help')
const Elastic = require('../lib/helper/elastic')

let deploy = null
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
            //api.deploy.by_name('sleep')

            let e = new Elastic(api, ['dc', 'deploy'])
            e.by_name('micro-x') 
                .then(definition => {
                    deploy = new Deployment(definition)
                })
        })
        .then(delay)
})

describe('Testing Deployment class', function () {
    it('should be an object', function () {
        assert.isObject(deploy, 'should be an object')
    })

    it('we expect to find a deployment named sleep', function () {
        assert.isFunction(deploy.get_containers, 'should return an object with the method get_container')
        assert.isArray(deploy.get_containers(), 'should be an array')
    })

    it('testing deployment image update capabilities', function () {
        assert.isFunction(deploy.get_containers, 'should return an object with the method get_container')
        assert.isArray(deploy.get_containers(), 'should be an array')
        let containers = deploy.get_containers()
        deploy.update('micro-x', {image: 'nginx'})
        assert.equal(containers[0].image, 'nginx', 'the remaining container should be called sleep')
    })

    it('Testing adding container', function () {
        let containers = deploy
            .add_container(
                {
                    name: 'okdr-ambss',
                    image:'busybox',
                    command: [  "sh",
                        "-c",
                        "echo Hello Kubernetes! && sleep 3600" ]
                }).get_containers()

        assert.equal(containers.length, 2, 'should be two container')
        assert.equal(containers[1].name, 'okdr-ambss', 'the remaining container should be called sleep')
    })


    it('finding container', () => {
        deploy.find_container('okdr-ambss')
            .ok(res => assert.isObject(res, 'we should find the container'))
            .fail(() => assert.equal(1,1,'This should not run'))
    })



    it('Testing container removal', function () {
        let containers = deploy.remove_container('okdr-ambss').get_containers()
        assert.equal(containers.length, 1, 'should be one container')
        assert.equal(containers[0].name, 'micro-x', 'the remaining container should be called sleep')

    })
})
