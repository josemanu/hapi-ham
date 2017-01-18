'use strict'


// Declare internals

const internals = {}

exports.register = function(server, options, next){
    server.decorate('reply', 'message', function (message) {
        let response
        switch(options.provider){
            case 'facebook-messenger': {
                const data = this.request.payload
                if (data && data.object === 'page') {
                    entry.messaging.forEach(function (event) {
                        let payload = {recipient: {id: event.sender.id}, message}
                        const url = `https://graph.facebook.com/v2.6/me/messages?access_token=${options.access_token}`
                        Wreck.post(url, {payload: payload}, (err, res, payload) => {
                            if(options.debug){
                                console.log(`FACEBOOK MESSENGER RESPONSE: ${payload}`)
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