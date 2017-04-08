'use strict'

// Load modules
const Wreck = require('wreck')

// Declare internals

const internals = {}

exports.register = function (server, options, next) {
  server.decorate('reply', 'message', function (message) {
    let response
    switch (options.provider) {
      case 'facebook-messenger': {
        const data = this.request.payload
        if (data && data.object === 'page') {
          data.entry.forEach(function (entry) {
            entry.messaging.forEach(function (event) {
              if (event.sender.id) {
                let payload = {}
                payload.recipient = { id: event.sender.id }
                payload.message = message

                const url = options.proxy || 'https://graph.facebook.com/v2.6/me/messages'
                const tokenParam = options.access_token ? `?access_token=${options.access_token}` : ''
                Wreck.post(url + tokenParam, { payload: payload }, (err, res, payload) => {
                  if (options.debug) {
                    console.log(`FACEBOOK MESSENGER RESPONSE: ${payload}`)
                  }
                })
              } else {
                response = { status: 'no sender id' }
              }
            })
          })
        }

        response = this.request.query['hub.challenge']
        break
      }
      default: {
        response = { status: 'ok' }
      }
    }
    return this.response(response)
  })

  server.ext('onPreHandler', function (request, reply) {
    let response
    switch (options.provider) {
      case 'facebook-messenger': {
        const data = request.payload
        if (data && data.object === 'page') {
          data.entry.forEach(function (entry) {
            entry.messaging.forEach(function (event) {
              if (options.debug) {
                console.log(`FACEBOOK MESSENGER REQUEST: ${JSON.stringify(event)}`)
              }
              response = event
              if (event.postback && event.postback.referral) {
                request.refParams = strParamToParamList(event.postback.referral.ref)
              } else if (event.referral) {
                request.refParams = strParamToParamList(event.referral.ref)
              }
            })
          })
        }
        break
      }
      default: {
        response = { status: 'success' }
      }
    }
    request.event = response
    return reply.continue()
  })

  next()
}

function strParamToParamList(strParam) {
  let strParamsList = strParam.split(',')
  const params = {}
  for (var i = 0; i < strParamsList.length; i++) {
    params[strParamsList[i].split(':')[0]] = strParamsList[i].split(':')[1]
  }
  return params
}

exports.register.attributes = {
  pkg: require('../package.json'),
  once: true
}