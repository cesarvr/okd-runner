let fs  = require('fs')
let _   = require('lodash')
var spawn = require('child_process').spawnSync

class File {
    constructor(){}
}

const UNKNOWN_APP_NAME = 'my-app'

function create_package_json(file) {

    let pkg =  `{
        "name": "${UNKNOWN_APP_NAME}",
        "version": "1.0.0",
        "description": "",
        "main": "${file}",
        "scripts": {
            "test": "echo \\"Error: no test specified\\" && exit 1",
            "start": "node ${file}"
        },
        "dependencies": {
            "okd-runner": "*"
        },
        "author": "${require('os').userInfo().username}"
    }`

    fs.writeFileSync('./package.json', pkg)
    return pkg
}

function setup_workspace(filename) {
    try {
        this.package = fs.readFileSync('./package.json').toString()
    }catch(e) {
        // We don't have a package.json, let's create one!
        console.warn('❗ Warning: can\'t find package.json, generating one... \n')
        create_package_json(path.basename(filename))
        process.exit()
    }
}

class Workspace {
    constructor(){
        this.files = fs.readdirSync('./')
        this.package = fs.readFileSync('./package.json').toString()
        try {
          this.package = JSON.parse(this.package)
        }catch(e) {
          console.warn('Failing to transform to JSON: ', this.package)
        }
    }

    fix_entry(){
        if( _.isEmpty(this.package.scripts.start) ) {
            this.package.scripts.start = `node ${this.package.main}`
            console.log(`can't find any start entry, adding this one ... ${this.package.scripts.start} `)
        }

        return this
    }

    save() {
        fs.writeFileSync('./package.json', JSON.stringify(this.package, null, 4))
        return this
    }

    get name() { return this.package.name }

    exclude(_rules) {
        this.files = this.files.filter(file => _rules.indexOf(file) === -1)
        return this
    }

    debug(){
        console.log(this.files)
        return this
    }

    compress(name){
        this.tmp_file = name || './okd.tar.gz'
        let args = ['-czf', this.tmp_file, '-C', '.', '.']
        let ret = spawn('tar', args)

        return this.tmp_file
    }

    clean(){
        fs.unlinkSync(this.tmp_file)
    }
}

module.exports = { Workspace, setup_workspace }
