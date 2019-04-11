#! /usr/bin/env node

'use strict'

const YargsPromise = require('yargs-promise')
const updateNotifier = require('update-notifier')
const onExit = require('async-exit-hook')
const utils = require('./utils')
const print = utils.print
const debug = require('debug')('ipfs:cli')
const pkg = require('../../package.json')
const parser = require('./parser')

const oneWeek = 1000 * 60 * 60 * 24 * 7
updateNotifier({ pkg, updateCheckInterval: oneWeek }).notify()

const cli = new YargsPromise(parser)

let getIpfs = null

cli
  .parse(process.argv.slice(2))
  .then(({ data, argv }) => {
    getIpfs = argv.getIpfs
    if (data) {
      print(data)
    }
  })
  .catch(({ error, argv }) => {
    getIpfs = argv.getIpfs
    if (error) {
      throw error
    }
    throw new Error('Unknown error, please re-run the command with DEBUG=ipfs:cli to see debug output')
  })

onExit(cb => {
  // If an IPFS instance was used in the handler then clean it up here
  if (getIpfs && getIpfs.instance) {
    const cleanup = getIpfs.rest[0]

    return cleanup()
      .then(() => cb())
      .catch(err => {
        print(err.message)
        debug(err)
        cb()
      })
  }
  cb()
})

onExit.unhandledRejectionHandler(err => {
  print(err.message)
  debug(err)
})
