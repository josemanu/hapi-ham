'use strict'

// Load modules
const Wreck = require('wreck')

// Declare internals

const internals = {}

exports.register = function(server, options, next){
    server.decorate('reply', 'message', function (message) {
        let response
        switch(options.provider){
            case 'facebook-messenger': {
                const data = this.request.payload
                if (data && data.object === 'page') {
                    data.entry.forEach(function (entry) {
                        entry.messaging.forEach(function (event) {
                            if(event.sender.id){
                                let payload = message
                                payload.recipient = {id: event.sender.id}
                            
                                const url = `https://graph.facebook.com/v2.6/me/messages?access_token=${options.access_token}`
                                Wreck.post(url, {payload: payload}, (err, res, payload) => {
                                    if(options.debug){
                                        console.log(`FACEBOOK MESSENGER RESPONSE: ${payload}`)
                                    }
                                })
                            }
                        })
                    })
                }

                response = this.request.query['hub.challenge']
                break
            }
            default: {
                response = {status: 'ok'}
            }
        }
        return this.response(response)
    })
    next()
}

exports.register.attributes = {
    pkg: require('../package.json'),
    connections: false,
    once: true
}