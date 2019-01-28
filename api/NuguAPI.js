const path = process.cwd()
const User = require( path + '/models/Schema')
const ROUND_TYPE = process.env.ROUND_TYPE
const EVERY_TYPE = process.env.EVERY_TYPE

module.exports = class Nugu{
    
    getRequest(type, json){
        return new Promise(function(resolve) {
            const today = new Date()
            const parameters = json.action.parameters
            const nuguInfo={}

            nuguInfo.oriPoint = typeof parameters['ori_point'] === 'undefined' ? '인천' : parameters['ori_point'].value
            if(type != EVERY_TYPE){ nuguInfo.desPoint = parameters['des_point'].value }
            nuguInfo.outMonth = typeof parameters['out_month'] === 'undefined' ? today.getUTCMonth()+1 : parameters['out_month'].value
            nuguInfo.outDay = typeof parameters['out_day'] === 'undefined' ? 0 : parameters['out_day'].value
            nuguInfo.outYear = today.getUTCFullYear() + diffYear(nuguInfo.outMonth,today.getUTCMonth()+1)
            nuguInfo.outMonth = pad(nuguInfo.outMonth)
            nuguInfo.outDay = pad(nuguInfo.outDay)

            if(type==ROUND_TYPE || type==EVERY_TYPE){
                nuguInfo.inMonth = typeof parameters['in_month'] === 'undefined' ? today.getUTCMonth()+1 : parameters['in_month'].value
                nuguInfo.inDay = typeof parameters['in_day'] === 'undefined' ? 0 : parameters['in_day'].value
                nuguInfo.inYear = today.getUTCFullYear() + diffYear(nuguInfo.inMonth,today.getUTCMonth()+1)
                nuguInfo.inMonth = pad(nuguInfo.inMonth)
                nuguInfo.inDay = pad(nuguInfo.inDay)
            }

            resolve(nuguInfo)
        })
    }
    responseOneway(onewayInfo, calendarInfo){
        return new Promise(function(resolve) {
            const jsonObj = {}
            const responseObj = {}
            
            //당일가격 존재할 경우
            if(onewayInfo.errorStatus=="OK"){
                console.log("당일가격 존재할 경우")
                const price = onewayInfo.price
                let res
                
                //직항일 경우
                if(onewayInfo["outItineraries"].length==1){
                    console.log("직항일 경우")
                    const r = onewayInfo.outItineraries[0]
                    res = r.outMonth+"월 "+r.outDay+"일에 " +
                          r.oriPoint+"에서 "+"출발하여 "+r.desPoint+"에 도착하는 최저가는 "+
                          r.carrier+"에서 직항으로 "+ r.outHour+"시 "+r.outMinute+"분에 출발하여 "+
                          r.inHour+"시 "+r.inMinute+"분에 도착하며, "+
                          "가격은 "+price+"원 입니다."
                    
                }else{//1회 경유일 경우
                    console.log("1회 경유일 경우")
                    const r1 = onewayInfo.outItineraries[0]
                    const r2 = onewayInfo.outItineraries[1]
                    res = r1.outMonth+"월 "+r1.outDay+"일에 " +
                          r1.oriPoint+"에서 "+"출발하여 "+r2.desPoint+"에 도착하는 최저가는 "+ 
                          r1.carrier+"에서 "+ r1.outHour+"시 "+r1.outMinute+"분에 출발하여 "+ 
                          r1.desPoint+"를 경유하여 "+ r2.inHour+"시 "+r2.inMinute+"분에 도착하며, "+
                          "가격은 "+price+"원 입니다."
                }
                //캘린더 존재 o
                if(calendarInfo.errorStatus=="OK"){
                    console.log("캘린더 존재")
                    const r = onewayInfo.outItineraries[0]
                    const aver = calendarInfo.totalAverage
                    const diff = (aver > price) ? (aver-price)+"원 저렴하네요." : (price-aver)+"원 비싸네요."
                    res +=" 이 날은 "+r.outMonth+"월 평균가보다 "+ diff
                }
                jsonObj['res'] = res
                responseObj['output'] = jsonObj
                responseObj['resultCode'] = "OK"
                
            }else{//당일가격 존재 x
                console.log("당일가격 존재하지 않을 경우")
                //캘린더 존재 o
                if(calendarInfo.errorStatus=="OK"){
                    console.log("캘린더 존재")
                    let res ="말씀해주신 "+calendarInfo.outMonth+"월 "+calendarInfo.outDay+"일 항공권이 조회가 되지 않네요. "+
                         calendarInfo.outMonth+"월의 평균가는 "+ calendarInfo.totalAverage +"이며, "+
                         calendarInfo.totalMin.day+"일이 "+ calendarInfo.totalMin.price+"원으로 가장 저렴한 날입니다."
                    jsonObj['res'] = res
                    responseObj['output'] = jsonObj
                    responseObj['resultCode'] = "OK"
                    
                }
                //캘린더 존재 x
                else{
                    console.log("캘린더 존재하지 않음")
                    responseObj['resultCode'] = onewayInfo.errorStatus
                    
                }

            }
            resolve(responseObj)           
        })
    }
    responseRound(roundInfo){
        return new Promise(function(resolve) {
            const jsonObj = {}
            const responseObj = {}

            if(roundInfo.errorStatus=="OK"){
                jsonObj['roundInfo'] = roundInfo
            }
            responseObj['output'] = jsonObj
            responseObj['resultCode'] = roundInfo.errorStatus
            resolve(responseObj) 
        })
    }
    responseEvery(everyInfo){
        return new Promise(function(resolve) {
            const jsonObj = {}
            const responseObj = {}

            if(everyInfo.errorStatus=="OK"){
                jsonObj['everyInfo'] = everyInfo
            }
            responseObj['output'] = jsonObj
            responseObj['resultCode'] = everyInfo.errorStatus
            resolve(responseObj) 
        })
    }
    responseReview(calendarInfo){
        return new Promise(function(resolve) {
            const jsonObj = {}
            const responseObj = {}

            if(calendarInfo.errorStatus=="OK"){
                jsonObj['average'] = calendarInfo.totalAverage
                jsonObj['min'] = calendarInfo.totalMin.price
                jsonObj['min_day'] = calendarInfo.totalMin.day
            }
            responseObj['output'] = jsonObj
            responseObj['resultCode'] = calendarInfo.errorStatus
            resolve(responseObj) 
        })
    }
}

function pad(n) {
    n = n + ''
    return n.length >= 2 ? n : '0' + n
}

function diffYear(outMonth,todayMonth){
    return outMonth >= todayMonth ? 0 : 1
}