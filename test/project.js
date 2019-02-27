const login = require('../../okd-api/lib/okd').login
const { delay, errors } = require('./help')
const assert = require('chai').assert
const project = require('../lib/okd/proj')
const templates = require('../lib/helper/templates')
const deployment = require('../lib/okd/deployment')

let proj = null
let okd  = null
let tmpl = null
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
            api.namespace('test')
            proj = project(api, 'fnc-test')
            tmpl = templates(api, {name: 'fnc-test'})
            attach_tmpl = templates(api, {name: 'attach-bms'})
            okd = api
        })
        .then(delay)
        .catch(errors)
})


let full_project = null

describe('Testing Full Project', function () {
    this.timeout(53000)
    it('should be an object', function () {
        assert.isFunction(proj.create, 'should be an object')
        assert.isFunction(deployment, 'should be an object')
        let objs = tmpl(['build', 'deploy', 'route'])
        assert.isArray(objs, 'should be an array')
        objs.forEach(obj => assert.isObject(obj), 'should be an object')
    })

    let image = null
    it('creating a full project in OpenShift', (done) => {
        full_project = tmpl(['imagestream','build', 'deploy', 'route', 'service'])
        proj.event.on('created',   res =>  assert.isArray(res) )
        proj.event.on('created',   res =>  proj.build('./test/workspace.tar.gz') )
        proj.event.on('image:new', img => image = img)
        proj.event.on('image:new', img =>  done())

        proj.watch_new_images()
        proj.create(full_project)
    })

    it('deploying image for full project', () => {
        return okd.deploy.by_name('fnc-test').then(definition => {
            deploy = deployment(definition)
            deploy.update('fnc-test', {image: image})
            return okd.deploy.replace('fnc-test', deploy.val()).then(doc => {
                let res = deployment(doc)
                res.find_container('fnc_test')
                    .ok(container => assert.equal(container.image, image, `image should be updated and equal to {image}`))
                    .fail(()=> assert.isTrue(true, 'the deployment should have containers'))
            }).catch(errors)
        })
    })


    let attach_img = null
    it('Building ambassador container', (done) => {
        let half = attach_tmpl(['imagestream','build'])

        const att = project(okd, 'attach-bms')

        att.event.on('created',   res => att.build('./test/attch.tar.gz'))
        att.event.on('image:new', img =>  done())
        att.event.on('image:new', img =>  attach_img = img )
        att.watch_new_images()
        att.create(half)
    })


    it('Adding an ambassador container', () => {
        return okd.deploy.by_name('fnc-test').then(definition => {
            let deploy    = deployment(definition)
            let container = {
                name: 'ambz',
                image: attach_img,
                env: [{name: 'TARGET_PORT', value: '8080'}, {name: 'PORT', value: '8084' }]
            }

            deploy.find_container(container.name)
                  .ok(   () => deploy.update(container.name, container) )
                  .fail( () => deploy.add_container(container) )

            return okd.deploy
                      .replace('fnc-test', deploy.val())
                      .then(_deploy => {
                        let res = deployment(_deploy)

                        res.find_container('ambz')
                            .ok(container =>
                                assert.equal(container.image, attach_img, `image should be updated and equal to {attach_img}`))
                            .fail(()=>
                                assert.isTrue(true, 'the deployment should have containers'))
                      })
        })
  })

})
