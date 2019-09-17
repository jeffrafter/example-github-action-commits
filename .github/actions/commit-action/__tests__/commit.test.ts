// import * as core from '@actions/core'
import * as github from '@actions/github'
// import run from '../commit'
import fs from 'fs'
import yaml from 'js-yaml'
import {WebhookPayload} from '@actions/github/lib/interfaces'

beforeEach(() => {
  jest.resetModules()
  const doc = yaml.safeLoad(fs.readFileSync(__dirname + '/../action.yml', 'utf8'))
  if (doc.inputs) {
    Object.keys(doc.inputs).forEach(name => {
      const envVar = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`
      process.env[envVar] = doc.inputs[name]['default']
    })
  }
  github.context.payload = {
    pusher: {
      name: 'mona',
    },
  } as WebhookPayload
})

afterEach(() => {
  const doc = yaml.safeLoad(fs.readFileSync(__dirname + '/../action.yml', 'utf8'))
  if (doc.inputs) {
    Object.keys(doc.inputs).forEach(name => {
      const envVar = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`
      delete process.env[envVar]
    })
  }
})

describe('commit action', () => {
  it('runs', async () => {
    expect(1).toEqual(1)
  })
})
