'use strict'

const Hapi = require('hapi')
const Kaiwa = require('kaiwa')
const Lab = require('lab')
const lab = exports.lab = Lab.script();
const Code = require('code')
const expect = Code.expect


lab.experiment('conversation', () => {

    const server = new Hapi.Server()
    server.connection({ port: 3000 })
    server.register({
        register: require('../'),
        options: {
            provider: 'facebook-messenger',
            access_token: '123',
            proxy: 'http://localhost:3001',
            debug: true
        }
    }, (err) => {

        if (err) {
            throw err
        }

        // Add the route
        server.route({
            method: ['POST', 'GET'],
            path: '/',
            handler: function (request, reply) {
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
    })

    const kaiwaOptions = {
        webHookURL: 'http://localhost:3000',
        testingPort: 3001
    }

    const tester = new Kaiwa.Tester(kaiwaOptions)

    tester.startListening((error) => {
        if (error) {
            throw error
        }
    })

    lab.test('send request and validate the response', (done) => {

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
            done()
        }).catch((error) => {
            throw error
            done()
        })
    })

})