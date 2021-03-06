import { Router } from 'express'
import * as _ from 'underscore'

import { IAppRequest } from 'src/interfaces'
import NotAuthorizedError from 'src/errors/NotAuthorizedError'

import advices from './advices'
import keys from './keys'
import plugins from './plugins'
import triggers from './triggers'

const packageJson = require('../../../package.json')
const router = Router()


/**
 * Gets the status of the server. A great way for the terminal to check if the
 * trading server is of the latest version or not.
 */
router.get('/', (_req: IAppRequest, res) => {
  res.json({
    sourceCode: 'https://github.com/cryptocontrol/algo-trading-server',
    version: packageJson.version,
    uptime: process.uptime()
  })
})


// For every route henceforth; require the user to be logged in
router.use((req: IAppRequest, _res, next) => {
  if (!req.uid) return next(new NotAuthorizedError)
  next()
})


// Gets the current user's id
router.get('/me', (req: IAppRequest, res) => res.json({ uid: req.uid }))


// init all the different routes
router.use('/advices', advices)
router.use('/keys', keys)
router.use('/plugins', plugins)
router.use('/triggers', triggers)


/**
 * Error handler
 */
router.use((err, _req, res, _next) => {
  console.log(err)
  res.status(err.status || 500)
  res.json({ error: err.message })
})


export default router
