const login = require('../../../okd-api/lib/okd').login
const { delay, errors } = require('../help')
const assert = require('chai').assert
const Attach = require('../../lib/okd/attach')

let _attach = null
let okd  = null

console.log('dir: ' , __dirname)
const path = __dirname
const package =  `${path}/attach.tar.gz`

before(function() {
    this.timeout(3000)
    return login({
        cluster: 'https://192.168.64.2:8443/',
        user:'user',
        password:'3298432849ueiw',
        strictSSL: false
    }).then(api => {
            api.namespace('test')
            _attach = new Attach({okd:api, name:'myproxy' ,target:'sleep'}) 
            okd = api
        })
      .then(delay)
})

describe('Add A Container To Running Deployment', function () {
    this.timeout(53000)

    it('building & making container', function (done) {
        okd.is.on_new('my_proxy-ambz',img => {
          console.log('img->', img) 
        })
        _attach.on('error', err=> assert.isNull(err, 'we expect here no errors'))
        _attach.on('attached', () => {
            done()
        })
        _attach.make(package)
    })

    it('building & making container', function (done) {

        _attach.on('error', err=> assert.isNull(err, 'we expect here no errors'))
        _attach.on('removed', () => {
           done() 
        })
        _attach.remove()
    })
})




