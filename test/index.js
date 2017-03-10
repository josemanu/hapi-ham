'use strict'

const Hapi = require('hapi')
const Kaiwa = require('kaiwa')
const Lab = require('lab')
const Code = require('code')

const { expect } = Code
const lab = exports.lab = Lab.script()
const { describe, it, before, after, beforeEach } = lab


describe('facebook messenger /index', () => {

  const provisionServer =  (options) => {

    const server = new Hapi.Server()
    server.connection(options)

    server.register({
      register: require('../'),
      options: {
        provider: 'facebook-messenger',
        access_token: '123',
        proxy: 'http://localhost:3001',
        logger:{
          console: true,
          level:'debug'
        }
      }
    }, (err) => {

      if (err) {
        throw err
      }

    })

    return server
  }


  it('send request and validate the response', (done) => {

      const server = provisionServer({ port: 3000 })
      server.route({
        method: ['POST', 'GET'],
        path: '/',
        handler: (request, reply) =>  {
          const template = {
            text: `Hola ${request.event.message.text}`
          }
          return reply.message(template)
        }
      })

      // Start the server
      server.start((err) => {
        if (err) {
          throw err;
        }
        console.log('Server running at:', server.info.uri)
      })

      const kaiwaOptions = {
        webHookURL: server.info.uri,
        testingPort: 3001
      }

      const tester = new Kaiwa.Tester(kaiwaOptions)

      tester.startListening((error) => {
        if (error) {
          throw error
        }
      })


        const messageToSend = {
            object: 'page',
            entry: [
                {
                    messaging: [
                        {
                            sender: { id: 1 },
                            message: { text: 'ping' }
                        }
                    ]
                }
            ]
        }
        const expectedMessage = {
            recipient: { id: 1 },
            message: { text: 'Hola ping' }
        }
    tester.runScript(messageToSend, expectedMessage).then((result) => {

            expect(result).to.be.true()
            server.stop((err) => {
              done()
            })

        }).catch((error) => {
            throw error
            done()
        })
    })

  it('doesnt have senderId property', (done) => {

    const server = provisionServer({ port: 3000 })
    server.route({
      method: ['POST', 'GET'],
      path: '/',
      handler: (request, reply) => {
        const template = {
          text: 'no data'
        }
        return reply.message(template)
      }
    })

    const messageToSend = {
      object: 'hello'
    }

    const request = {
      method: 'POST',
      url: '/',
      payload: {
        object: 'page',
        entry: [
          {
            messaging: [
              {
                message: { text: 'ping' }
              }
            ]
          }
        ]
      }
    }

    server.inject(request, response => {

      expect(response.statusCode).to.equals(400)
      expect(response.result.message).to.match(/provided/i)
      done()
    })
  })

  it('invalid payload', (done) => {

    const server = provisionServer({ port: 3000 })
    server.route({
      method: ['POST', 'GET'],
      path: '/',
      handler: (request, reply) => {
        const template = {
          text: 'no data'
        }
        return reply.message(template)
      }
    })

    const messageToSend = {
      object: 'hello'
    }

    const request = {
      method: 'POST',
      url: '/',
      payload: {
        foo: 'bar'
      }
    }

    server.inject(request, response => {

      expect(response.statusCode).to.equals(400)
      expect(response.result.message).to.match(/format/i)
      done()
    })
  })

  it('invalid provider', (done) => {

    const server = new Hapi.Server()
    server.connection({})

    server.register({
      register: require('../'),
      options: {
        provider: 'invalid-provider',
        proxy: 'http://localhost:3001',
        logger:{
          console: true,
          level:'debug'
        }
      }
    }, (err) => {

      if (err) {
        throw err
      }

    })

    server.route({
      method: ['POST', 'GET'],
      path: '/',
      handler: (request, reply) => {

        return reply.message({})
      }
    })

    const messageToSend = {
      object: 'hello'
    }

    const request = {
      method: 'POST',
      url: '/',
      payload: {
        foo: 'bar'
      }
    }

    server.inject(request, response => {

      expect(response.statusCode).to.equals(400)
      expect(response.result.message).to.match(/provider/i)
      done()
    })
  })

})
