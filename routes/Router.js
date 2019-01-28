const express = require('express')
const router = express.Router()
const controller = require('./Controller')

router.use(express.json())
router.post('/oneway-ticketPrice', controller.oneway)
router.post('/round-ticketPrice', controller.round)
router.post('/everyWhere', controller.everyWhere)
router.post('/review', controller.review)
module.exports = router