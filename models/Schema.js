const mongoose = require('mongoose')
/*
const userSchema = new mongoose.Schema({
    id : { type: String, required: true, unique: true },
    name : { type: String, required: true },
    phone : { type: String, required: true }
},
{
  timestamps: true
})
*/
const userSchema = new mongoose.Schema({
    user_id : { type: String, required: true },
    origin : { type: String, default:'인천' },
    destination : { type: String, required: true },
    out_year : { type: Number, required: true },
    out_month : { type: Number, required: true },
    out_day : { type: Number, default: 1 },
    price : { type: Number, default: 0}
},
{
    timestamps: true
})

// create new user document 
userSchema.statics.createOneByOne =function(user_id, origin, destination, out_year, out_month, out_day, price, via){
    const user = new this()
    return new Promise(function(resolve){
        user.user_id = user_id
        user.origin = origin
        user.destination = destination
        user.out_year = out_year
        user.out_month = out_month
        user.out_day = out_day
        user.price = price
        user.via = via
    
        user.save(function(err){
            if(err){
                console.error(err);
                resolve(0)
                return
            }
            console.log("db 생성")
            resolve(1)
        })
    })
}
userSchema.statics.createAll = function(payload){
    const user = new this(payload)
    return user.save()
}
// find all
userSchema.statics.findAll = function(){
    const find = this.find()
    return new Promise(function(resolve){
        resolve(find)
    })
}

// delete by id
userSchema.statics.deleteById = function(id){
    return this.remove({id})
}

// remove all
userSchema.statics.removeAll = function(){
    const remove = this.remove()
    return new Promise(function(resolve){
        resolve(remove)
    })
}

mongoose.set('useCreateIndex', true)
module.exports =  mongoose.model('User', userSchema)
