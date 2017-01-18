'use strict'


// Declare internals

const internals = {}

exports.register = function(server, options, next){
    server.decorate('replay', 'message', (message) => {
        let response
        switch(options.provider){
            case 'facebook-messenger': {
                response = this.request.query['hub.challenge']
                break
            }
            default: {
                response = {status: 'ok'}
            }
        }
        return response
    })
    next()
}

exports.register.attributes = {
    pkg: require('../package.json'),
    connections: false,
    once: true
}