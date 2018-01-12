'use strict'


const Areas = require('./models/Areas')
const Images = require('./models/Images')
const Groups = require('./models/Groups')
const Hikes = require('./models/Hikes')
const Lists = require('./models/Lists')
const Places = require('./models/Places')


// console.log('** AREAS **')  // 81
// const areas = new Areas()
// areas.testStructureOfRandomObjects(5)
// areas.testStructureOfAllObjects()

// console.log('** IMAGES **')  // 62.088
// const images = new Images()
// images.testStructureOfRandomObjects(5)
// images.testStructureOfAllObjects()


// console.log('** GROUPS **')  // 1153
const groups = new Groups()
groups.testStructureOfRandomObjects(5)
// groups.testStructureOfAllObjects()


// console.log('** HIKES **')  // 19.101
// const hikes = new Hikes()
// hikes.testStructureOfRandomObjects(5)
// hikes.testStructureOfAllObjects()


// console.log('** LISTS **')  // 262
// const lists = new Lists()
// lists.testStructureOfRandomObjects(5)
// lists.testStructureOfAllObjects()


// console.log('** PLACES **')  // 4.481
// const places = new Places()
// places.testStructureOfRandomObjects(5)
// places.testStructureOfAllObjects()
