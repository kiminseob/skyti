const path = process.cwd()
const User = require( path + '/models/Schema')

module.exports = class OnewayDBLogic{
   
    saveInfo(nuguInfo, oriSkyInfo, desSkyInfo, onewayInfo){
        return new Promise(async function(resolve) {
            if(onewayInfo.errorStatus=="OK"){
                try{
                    const result = await User.createOneByOne(
                        "kis6473",
                        oriSkyInfo.PlaceName,
                        desSkyInfo.PlaceName,
                        nuguInfo.outYear,
                        nuguInfo.outMonth,
                        nuguInfo.outDay,
                        onewayInfo.price,
                    )
                    resolve(result)
                    return
                }catch(error){
                    console.log('oneway save db error :',error)
                }
            }
            resolve(0)
        })
    }
    findAllInfo(){
        return new Promise(async function(resolve, reject) {
            try{
                resolve(await User.findAll())
            }
            catch(error){
                console.log('oneway findAll db error :',error)
                reject(Error("oneway findAll db error"))
            }
        })
    }
    removeAllInfo(){
        return new Promise(async function(resolve, reject) {
            try{
                resolve(await User.removeAll())
            }catch(error){
                console.log('oneway removeAll db error :',error)
                reject(Error("oneway removeAll db error"))
            }
        })
    }
    dropCollection(){
        User.collection.drop()
    }
}
