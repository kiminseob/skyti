// 현재 working directory 위치를 반환한다.
const path = process.cwd()
const Nugu = require( path + process.env.NUGU_PATH )
const Sky = require( path + process.env.SKY_PATH )
//const DB = require( './DBLogic')
const ONEWAY_TYPE = process.env.ONEWAY_TYPE
const ROUND_TYPE = process.env.ROUND_TYPE
const EVERY_TYPE = process.env.EVERY_TYPE

exports.oneway = async function (req, res){

	const nugu = new Nugu()
	const sky = new Sky()
	//const db = new DB()

	try{
		const nuguInfo = await nugu.getRequest(ONEWAY_TYPE, req.body)
		//console.log('nuguInfo :',nuguInfo)
		const oriSkyInfo = await sky.getRequest(nuguInfo.oriPoint)
		//console.log('oriSkyInfo :',oriSkyInfo)
		const desSkyInfo = await sky.getRequest(nuguInfo.desPoint)
		//console.log('desSkyInfo :',desSkyInfo)
		const onewayInfo = await sky.postRequest(ONEWAY_TYPE, nuguInfo, oriSkyInfo, desSkyInfo)
		//console.log('priceInfo :',priceInfo)
		const calendarInfo = await sky.getRequestToCalendar(nuguInfo, oriSkyInfo, desSkyInfo)
		//console.log('calendarInfo :',calendarInfo)
		const response = await nugu.responseOneway(onewayInfo, calendarInfo)
		
		//const removeResult = await db.removeAllInfo()
		//const saveResult = await db.saveInfo(nuguInfo, oriSkyInfo, desSkyInfo, onewayInfo)
		//const findResult = await db.findAllInfo()
		//console.log('saveOneway removeResult :',removeResult)
		//console.log('saveOneway saveResult :',saveResult)
		//console.log('saveOneway findResult :',findResult)
		
		return res.json(response)
	}catch(error){
		console.log('unknown error : ',error)
		const responseObj = {}
		responseObj['resultCode'] = process.env.STATUS_UNKNOWN
		return res.json(responseObj)
	}
	
}

exports.round = async function (req, res){

	const nugu = new Nugu()
	const sky = new Sky()
	//const db = new DB()

	try{
		const nuguInfo = await nugu.getRequest(ROUND_TYPE, req.body)
		//console.log('nuguInfo :',nuguInfo)
		const oriSkyInfo = await sky.getRequest(nuguInfo.oriPoint)
		console.log('oriSkyInfo :',oriSkyInfo)
		const desSkyInfo = await sky.getRequest(nuguInfo.desPoint)
		console.log('desSkyInfo :',desSkyInfo)
		const roundInfo = await sky.postRequest(ROUND_TYPE, nuguInfo, oriSkyInfo, desSkyInfo)
		const response = await nugu.responseRound(roundInfo)
		
		//const removeResult = await db.removeAllInfo()
		//const saveResult = await db.saveInfo(nuguInfo, oriSkyInfo, desSkyInfo, roundInfo)
		//const findResult = await db.findAllInfo()
		//console.log('saveOneway removeResult :',removeResult)
		//console.log('saveOneway saveResult :',saveResult)
		//console.log('saveOneway findResult :',findResult)
		
		return res.json(response)
	}catch(error){
		console.log('unknown error : ',error)
		const responseObj = {}
		responseObj['resultCode'] = process.env.STATUS_UNKNOWN
		return res.json(responseObj)
	}
	
}

exports.everyWhere= async function(req, res){
	const nugu = new Nugu()
	const sky = new Sky()
	
	try{
		const nuguInfo = await nugu.getRequest(EVERY_TYPE, req.body)
		const oriSkyInfo = await sky.getRequest(nuguInfo.oriPoint)
		const everyInfo = await sky.getRequestToEvery(EVERY_TYPE, nuguInfo, oriSkyInfo)
		const response = await nugu.responseEvery(everyInfo)
		
		return res.json(response)
	}catch(error){
		console.log('unknown error : ',error)
		const responseObj = {}
		responseObj['resultCode'] = process.env.STATUS_UNKNOWN
		return res.json(responseObj)
	}
}

exports.review = async function(req, res){
	const nugu = new Nugu()
	const sky = new Sky()
	
	try{
		const nuguInfo = await nugu.getRequest(ONEWAY_TYPE, req.body)
		const oriSkyInfo = await sky.getRequest(nuguInfo.oriPoint)
		const desSkyInfo = await sky.getRequest(nuguInfo.desPoint)
		const calendarInfo = await sky.getRequestToCalendar(nuguInfo, oriSkyInfo, desSkyInfo)
		const response = await nugu.responseReview(calendarInfo)
		
		return res.json(response)
	}catch(error){
		console.log('unknown error : ',error)
		const responseObj = {}
		responseObj['resultCode'] = process.env.STATUS_UNKNOWN
		return res.json(responseObj)
	}
}