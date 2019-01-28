const request = require('request')
const utf8 = require('utf8')
const ROUND_TYPE = process.env.ROUND_TYPE

module.exports = class Sky{

    getRequest(point){
        return new Promise(function(resolve) {
            point = utf8.encode(point)
            const url = process.env.GET_HEAD_URL + point + process.env.GET_TAIL_URL
            
            const options = {
                'url' : url,
                'headers' : {
                    'user-agent' : 'Chrome/70.0.3538.102',
                    'content-type' : 'application/json; charset=utf-8'
                }
            }
            request(options, (error, response, body) =>{
                if (error) throw error
                const jsonObj = JSON.parse(body)
                let skyInfo = jsonObj[0]
                
                /* 
                ex) 대전 -> 청주 매핑 같은 경우, 대전에는 공항이 존재하지 않아(PlaceId가 없다) 
                AirportInformation에 근처 공항정보가 담겨있다. (아직 몇개까지 담겨있는진 모름)
                */
                if(typeof jsonObj[0]['PlaceId'] === 'undefined'){
                    skyInfo = jsonObj[0]['AirportInformation']
                }
                /*
                ex) '도시' 또는 '공항'이 아닌 '나라' 이름으로 발화했을 경우
                도시정보(CityId)가 바로 들어있지 않고 따로 붙어있다, 
                (이 경우 일단은 가장 첫 번째로 나오는 공항을 매핑함.)
                */
                if(jsonObj[0]['CountryName'] ==jsonObj[0]['PlaceName']){
                    skyInfo = jsonObj[1]
                }

                resolve(skyInfo)
            })
        })
    }
    getRequestToCalendar(nuguInfo, oriSkyInfo, desSkyInfo){
        return new Promise(function(resolve) {
            const url = process.env.CALENDAR_HEAD_URL + 
                        oriSkyInfo.PlaceId +'/'+ desSkyInfo.PlaceId +'/'+ nuguInfo.outYear +'-'+ nuguInfo.outMonth +
                        process.env.CALENDAR_TAIL_URL
            const options = {
                'url' : url,
                'headers' : {
                    'user-agent' : 'Chrome/70.0.3538.102',
                    'content-type' : 'application/json; charset=utf-8'
                }
            }
            request(options, (error, response, body) =>{
                if (error) throw error
                const jsonObj = JSON.parse(body)
                const jsonArr = jsonObj.PriceGrids.Grid[0]
                const direct = []
                const indirect = []
                const calendarInfo = {}
                
                for(let i=0; i<jsonArr.length; i++){
                    let tempObj = jsonArr[i]
                    let directInfo = {}
                    let indirectInfo = {}
                    if(typeof tempObj["Direct"] === "undefined"){ 
                        /* do nothing */
                    }else{
                        directInfo.price = approximate(tempObj["Direct"].Price)
                        directInfo.day = i + 1
                        direct.push(directInfo)
                    }
                    if(typeof tempObj["Indirect"] === "undefined"){ 
                        /* do nothing */
                    }else{
                        indirectInfo.price = approximate(tempObj["Indirect"].Price)
                        indirectInfo.day = i + 1
                        indirect.push(indirectInfo)
                    }
                }
                console.log("direct.length :",direct.length)
                console.log("indirect.length :",indirect.length)
                if(direct.length == 0 && indirect.length == 0){
                    calendarInfo.errorStatus = process.env.STATUS_CALENDAR_ZERO
                    resolve(calendarInfo)
                    return
                }
                direct.sort(comparePrice)
                indirect.sort(comparePrice)
                
                if(direct.length > 0 && indirect.length > 0){
                    calendarInfo.totalMin = findMin(direct, indirect)
                    calendarInfo.totalMax = findMax(direct, indirect)
                    calendarInfo.totalAverage = approximate( ( findAverage(direct) + findAverage(indirect) ) / 2 )
                }
                else{
                    ( direct.length == 0 ) ? setCalendarInfo(calendarInfo, indirect) : setCalendarInfo(calendarInfo,direct)
                }
                                
                console.log("totalMin:",calendarInfo.totalMin)
                console.log("totalMax:",calendarInfo.totalMax)
                console.log("totalAverage:",calendarInfo.totalAverage)
                calendarInfo.outMonth = nuguInfo.outMonth
                calendarInfo.outDay = nuguInfo.outDay
                calendarInfo.errorStatus = "OK"
                resolve(calendarInfo)
            })
        })
    }
    getRequestToEvery(EVERY_TYPE, nuguInfo, oriSkyInfo){
        return new Promise(async function(resolve) {
            const url = process.env.EVERY_GET_HEAD_URL+
            oriSkyInfo.PlaceId+"/anywhere/"+
            nuguInfo.outYear+"-"+nuguInfo.outMonth+"-"+nuguInfo.outDay+"/"+nuguInfo.inYear+"-"+nuguInfo.inMonth+"-"+nuguInfo.inDay+
            process.env.EVERY_GET_TAIL_URL
            
            const options = {
                'url' : url,
                'headers' : {
                    'user-agent' : 'Chrome/70.0.3538.102',
                    'content-type' : 'application/json; charset=utf-8'
                }
            }
            request(options, (error, response, body) =>{
                if (error) throw error
                const jsonObj = JSON.parse(body)
                const placePrices = jsonObj['PlacePrices']
                const everyInfo=[]
                const resultInfo = {}

                for(let i=0; i<placePrices.length; i++){
                    let tmp = {}
                    if(placePrices[i].Name!="대한민국"){
                        if(typeof placePrices[i].DirectPrice !== "undefined" && typeof placePrices[i].IndirectPrice !== "undefined"){
                            tmp.name = placePrices[i].Name
                            tmp.price = (placePrices[i].DirectPrice) > placePrices[i].IndirectPrice ? placePrices[i].IndirectPrice : placePrices[i].DirectPrice
                            if(tmp.price!=0){
                                tmp.price = approximate(tmp.price)
                                everyInfo.push(tmp)
                            }
                        }
                        if(typeof placePrices[i].DirectPrice !== "undefined" && typeof placePrices[i].IndirectPrice === "undefined"){
                            tmp.name = placePrices[i].Name
                            tmp.price = placePrices[i].DirectPrice
                            if(tmp.price!=0){
                                tmp.price = approximate(tmp.price)
                                everyInfo.push(tmp)
                            }
                        }
                        if(typeof placePrices[i].DirectPrice === "undefined" && typeof placePrices[i].IndirectPrice !== "undefined"){
                            tmp.name = placePrices[i].Name
                            tmp.price = placePrices[i].IndirectPrice
                            if(tmp.price!=0){
                                tmp.price = approximate(tmp.price)
                                everyInfo.push(tmp)
                            }
                        }
                    }
                }
                everyInfo.sort(comparePrice)
                
                const randomIdx1 = generateRandom(0,2)
                const randomIdx2 = generateRandom(3,4)
                
                console.log(everyInfo)
                resultInfo.every1 = everyInfo[randomIdx1]
                resultInfo.every2 = everyInfo[randomIdx2]
                resultInfo.errorStatus="OK"
                console.log(resultInfo)
                resolve(resultInfo)
            })
        })
    }
    postRequest(type, nuguInfo, oriSkyInfo, desSkyInfo){
        return new Promise(async function(resolve) {
            const payloads = payload(type, nuguInfo, oriSkyInfo, desSkyInfo)
            const options = {
                'url' : process.env.POST_URL,
                'body' : payloads,
                'headers' : {
                    'x-skyscanner-channelid':'website',
                    'user-agent' : 'Chrome/70.0.3538.102',
                    'content-type' : 'application/json; charset=utf-8'
                }
            }
            request.post(options,(error, response, body) =>{
                if (error) throw error
                const jsonObj = JSON.parse(body)
                const itineraries = jsonObj['itineraries']
                const legs = jsonObj['legs']
                const resultInfo = {}
                const outItinerariesInfo = []
                const inItinerariesInfo = []
    
                // 항공편이 없으면 error정보를 담아 리턴
                if(typeof itineraries === 'undefined'){
                    resultInfo.errorStatus = process.env.STATUS_UNDEFINED
                    resolve(resultInfo)
                    return 
                }
                // 추천순으로 정렬
                itineraries.sort(compareScore)
                // 추천 순위 상위 5개 추출
                const splicedItineraries = itineraries.splice(0,5)
                
                let parsedItineraries
                if(type==ROUND_TYPE){
                    // 상위 5개에 항공편에 대한 legs 정보 parsing
                    parsedItineraries =  roundItinerariesParsing(splicedItineraries, legs)
                    // 추천 1순위 항공편 (가는편) 파싱
                    setItinerariesInfo(outItinerariesInfo, parsedItineraries[0].segment_ids[0], jsonObj)
                    // 추천 1순위 항공편 (오는편) 파싱
                    setItinerariesInfo(inItinerariesInfo, parsedItineraries[0].segment_ids[1], jsonObj)
                }
                else{
                     // 상위 5개에 항공편에 대한 legs 정보 parsing (직항, 1회경유만 뽑음)
                    parsedItineraries = itinerariesParsing(splicedItineraries, legs)
                    // 추천 1순위 항공편 (가는편) 파싱
                    setItinerariesInfo(outItinerariesInfo, parsedItineraries[0].segment_ids, jsonObj)
                }
                resultInfo.price = parsedItineraries[0].price
                resultInfo.url = parsedItineraries[0].url
                resultInfo.outItineraries = outItinerariesInfo
                resultInfo.inItineraries = inItinerariesInfo
                
                resultInfo.errorStatus = "OK"
                
                resolve(resultInfo)
            })
            
        })
    }
   
}

function setItinerariesInfo(itinerariesInfo, segments , jsonObj){
    
    for(let i=0; i<segments.length; i++){
        const segment = segments[i].split('-')
        const json = {}
        
        json.carrier = findNameById('-'+segment[5], jsonObj['carriers'])
        json.oriPoint = findNameById(segment[0], jsonObj['places'])
        json.desPoint = findNameById(segment[1], jsonObj['places'])

        json.outYear = segment[2].substring(0,2)
        json.outMonth = segment[2].substring(2,4)
        json.outDay = segment[2].substring(4,6)
        json.outHour = segment[2].substring(6,8)
        json.outMinute = segment[2].substring(8,10)

        json.inYear = segment[3].substring(0,2)
        json.inMonth = segment[3].substring(2,4)
        json.inDay = segment[3].substring(4,6)
        json.inHour = segment[3].substring(6,8)
        json.inMinute = segment[3].substring(8,10)

        itinerariesInfo.push(json)
    }   
    
}

function itinerariesParsing(itineraries, legs){
    const itinerariesInfo=[]
    
    for(let i=0; i<itineraries.length; i++){
        const tmp={}
        // 경유 1회 이하인 경우만 파싱했었는데 추천순으로 이미 경유횟수가 필터링됐기 때문에 idPattern매칭부분이 필요없어졌음
        //if(idPattern(itineraries[i].id)!= -1){
        tmp.id = itineraries[i].id
        tmp.segment_ids = legs[i].segment_ids
        tmp.price = itineraries[i].pricing_options[0].items[0].price.amount
        tmp.url = itineraries[i].pricing_options[0].items[0].url
        itinerariesInfo.push(tmp)
        //}       
    }
    return itinerariesInfo
}
function roundItinerariesParsing(itineraries, legs){
    const itinerariesInfo=[]
    
    for(let i=0; i<itineraries.length; i++){
        const tmp={}
        const segment_ids=[]
        const itineraries_ids = itineraries[i].id.split('|')
        
        for(let j=0; j<legs.length; j++){
            if(itineraries_ids[0]==legs[j].id){
                segment_ids[0] = legs[j].segment_ids
            }
            if(itineraries_ids[1]==legs[j].id){
                segment_ids[1] = legs[j].segment_ids
            }
        }
        tmp.id = itineraries_ids
        tmp.segment_ids = segment_ids
        tmp.price = itineraries[i].pricing_options[0].items[0].price.amount
        tmp.url = itineraries[i].pricing_options[0].items[0].url
        itinerariesInfo.push(tmp)
               
    }
    return itinerariesInfo
}

function idPattern(id){
    //-1이 아니면 즉, 매칭되는 것이 있다면
    //직항일 경우 
    if(id.search(/\d{5}-\d{10}--\d{5}-0-\d{5}-\d{10}/) != -1){
        return 1
    }
    //1회 경유 항공사 같을 경우
    else if(id.search(/\d{5}-\d{10}--\d{5}-1-\d{5}-\d{10}/) != -1){
        return 2
    }
    //1회 경유 항공사 다를 경우
    else if(id.search(/\d{5}-\d{10}--\d{5},-\d{5}-1-\d{5}-\d{10}/) != -1){
        return 3
    }
    else{
        return -1
    }
}

function findNameById(id, obj){
    let tmp = obj
    for(let i=0; i<tmp.length; i++){
        if(tmp[i].id == id){
            return tmp[i].name
        }
    }
}

function payload(type, nuguInfo, oriSkyInfo, desSkyInfo){
    const outYear = nuguInfo.outYear
    const outMonth = nuguInfo.outMonth
    const outDay = nuguInfo.outDay
    let inYear
    let inMonth
    let inDay

    if(type == ROUND_TYPE){
        inYear = nuguInfo.inYear
        inMonth = nuguInfo.inMonth
        inDay = nuguInfo.inDay
    }

    let tempArr = oriSkyInfo.Location.split(',')
    oriSkyInfo.Location = swap(tempArr,0,1)
    tempArr = desSkyInfo.Location.split(',')
    desSkyInfo.Location = swap(tempArr,0,1)

    const jsonObj = {}
    const jsonArr = new Array()
    let tempObj = {}

    jsonObj['market'] = 'KR'
    jsonObj['currency'] = 'KRW'
    jsonObj['locale'] = 'ko-KR'
    jsonObj['cabin_class'] = 'economy'
    jsonObj['prefer_directs'] = true
    jsonObj['trip_type'] = type
    
    tempObj['origin'] = oriSkyInfo.PlaceId
    tempObj['destination'] = desSkyInfo.PlaceId
    if(type == ROUND_TYPE){ tempObj['return_date'] = inYear+'-'+inMonth+'-'+inDay }
    tempObj['date'] = outYear+'-'+outMonth+'-'+outDay
    jsonArr.push(tempObj)
    jsonObj['legs'] = jsonArr
    tempObj={}

    tempObj['id'] = oriSkyInfo.PlaceId
    if(oriSkyInfo.PlaceId.length == 4){ tempObj['airportId'] = oriSkyInfo.PlaceId }
    tempObj['name'] = oriSkyInfo.PlaceName
    tempObj['cityId'] = oriSkyInfo.CityId
    tempObj['cityName'] = oriSkyInfo.PlaceName
    tempObj['countryId'] = oriSkyInfo.CountryId
    oriSkyInfo.PlaceId.length == 4 ? tempObj['type'] = "City" : tempObj['type'] = "Airport"
    tempObj['centroidCoordinates'] = oriSkyInfo.Location
    jsonObj['origin'] = tempObj
    tempObj={}

    tempObj['id'] = desSkyInfo.PlaceId
    if(desSkyInfo.PlaceId.length == 4){ tempObj['airportId'] = desSkyInfo.PlaceId }
    tempObj['name'] = desSkyInfo.PlaceName
    tempObj['cityId'] = desSkyInfo.CityId
    tempObj['cityName'] = desSkyInfo.PlaceName
    tempObj['countryId'] = desSkyInfo.CountryId
    desSkyInfo.PlaceId.length == 4 ? tempObj['type'] = "City" : tempObj['type'] = "Airport"
    tempObj['centroidCoordinates'] = desSkyInfo.Location
    jsonObj['destination'] = tempObj
    tempObj={}

    if(type==ROUND_TYPE){ jsonObj['inboundDate'] = inYear+'-'+inMonth+'-'+inDay }
    jsonObj['outboundDate'] = outYear+'-'+outMonth+'-'+outDay
    jsonObj['adults'] = 1
    jsonObj['child_ages'] = []

    tempObj['include_unpriced_itineraries'] = true
    tempObj['include_mixed_booking_options'] = true
    jsonObj['options'] = tempObj
    
    return JSON.stringify(jsonObj)
}

function swap(arr, i, j){
    let temp = arr[i]
    arr[i] = Number(arr[j])
    arr[j] = Number(temp)
    return arr
}

//100원 단위 반올림
function approximate(price){
    return Math.floor((price+500)/1000)*1000
}

//최저가순 오름차순 정렬
function comparePrice(a, b) {   
    return a["price"] - b["price"];   
}
//추천순 내림차순 정렬
function compareScore(a, b) {   
    return b["score"] - a["score"];   
}

function findMin(a, b){
    return a[0].price > b[0].price ? b[0] : a[0]
}

function findMax(a, b){
    return a[a.length-1] > b[b.length-1] ? a[a.length-1] : b[b.length-1]
}

function findAverage(arr){
    let sum = 0
    
    for(let i=0; i<arr.length; i++){
        sum += arr[i].price
    }
    return sum / arr.length    
}

function setCalendarInfo(obj, arr){
    obj.totalMin = arr[0]
    obj.totalMax = arr[arr.length-1]
    obj.totalAverage = approximate( findAverage(arr) )
}
// min~max 사이의 난수 생성
function generateRandom(min, max) {
    const ranNum = Math.floor(Math.random()*(max-min+1)) + min;
    return ranNum;
  }