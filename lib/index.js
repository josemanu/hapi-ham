'use strict'

// Load modules
const Wreck = require('wreck')
const Boom = require('boom')
const Hoek = require('hoek')
// Declare internals

const internals = {}

exports.register = (server, options, next) => {

  server.register({
    register: require('bucker'),
    options: options.logger || {}
  }, (err) => {
    next()
  })

  server.decorate('reply', 'message', function (message, botToken) {

    let response

    let defaults = {
      proxy: 'https://graph.facebook.com/v2.6/me/messages',
      access_token: ''
    }

    switch (options.provider) {
      case 'facebook-messenger': {

        server.log('debug', 'Using facebook-messenger provider')
        const data = this.request.payload
        if (data && data.object === 'page') {
          data.entry.forEach((entry) => {
            entry.messaging.forEach((event) => {

              if (event.sender && event.sender.id) {

                let payload = {}
                payload.recipient = { id: event.sender.id }
                payload.message = message

                const config = Hoek.applyToDefaults(defaults, options)
                const url = config.proxy
                const tokenParam = botToken ? `?access_token=${botToken}` : config.access_token ? `?access_token=${config.access_token}` : ''

                Wreck.post(url + tokenParam, { payload: payload }, (err, res, payload) => {
                  server.log('debug', 'FACEBOOK MESSENGER RESPONSE ->')
                  server.log('debug', payload.toString())
                })
              } else {

                const msg = 'Invalid message format, no sender id provided'
                server.log('error', msg)
                response = Boom.badRequest(msg)
              }
            })
          })
        } else {
          const msg = 'Invalid message format'
          server.log('error', msg)
          response = Boom.badRequest(msg)
        }

        break
      }
      default: {

        const msg = 'Invalid provider'
        server.log('error', msg)
        response = Boom.badRequest(msg)
      }
    }

    return this.response(response)
  })

  server.decorate('reply', 'validateWebhook', function () {
    let response
    switch (options.provider) {
      case 'facebook-messenger': {
        response = this.request.query['hub.challenge']
      }
      default: {
        const msg = 'Invalid provider'
        server.log('error', msg)
        response = Boom.badRequest(msg)
      }
    }
    return this.response(response)
  })

  server.decorate('reply', 'notify', function (message, botToken, userId) {
    let response

    let defaults = {
      proxy: 'https://graph.facebook.com/v2.6/me/messages',
      access_token: ''
    }

    switch (options.provider) {
      case 'facebook-messenger': {

        server.log('debug', 'Using facebook-messenger provider')

        if (userId) {

          let payload = {}
          payload.recipient = { id: userId }
          payload.message = message

          const config = Hoek.applyToDefaults(defaults, options)
          const url = config.proxy
          const tokenParam = botToken ? `?access_token=${botToken}` : config.access_token ? `?access_token=${config.access_token}` : ''

          Wreck.post(url + tokenParam, { payload: payload }, (err, res, payload) => {
            server.log('debug', 'FACEBOOK MESSENGER RESPONSE ->')
            server.log('debug', payload.toString())
          })
        } else {

          const msg = 'Invalid message format, no sender id provided'
          server.log('error', msg)
          response = Boom.badRequest(msg)
        }

        break
      }
      default: {

        const msg = 'Invalid provider'
        server.log('error', msg)
        response = Boom.badRequest(msg)
      }
    }

    return this.response(response)
  })

  server.ext('onPreHandler', (request, reply) => {

    let response
    switch (options.provider) {
      case 'facebook-messenger': {
        const data = request.payload

        if (data && data.object === 'page') {

          data.entry.forEach((entry) => {

            entry.messaging.forEach((event) => {

              request.server.log('debug', 'FACEBOOK MESSENGER REQUEST:')
              request.server.log('debug', event)
              response = event

              if (event.postback && event.postback.referral) {
                request.refParams = internals.strParamToParamList(event.postback.referral.ref)
              } else if (event.referral) {
                request.refParams = internals.strParamToParamList(event.referral.ref)
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

internals.strParamToParamList = (strParam) => {
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
