const delay = (time, ret) => {
    return new Promise( (resolve) => {
        setTimeout(() => { resolve(ret) }, time || 1000)
    } )
}

const _delay = (delay) => {
    return () => {
        return new Promise( (resolve) => {
            setTimeout(() => { resolve() }, delay)
        } )
    }
}

let errors = (err) => console.log('errors while testing ==>   ', err)


module.exports = {delay, delayFor: _delay, errors}
