const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name:  {
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    passwordHash:{
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    isAdmin:{
        type: Boolean,
        default: false
    },
    address:{
        type: String,
        default: ''
    },
    address2:{
        type: String,
        default: ''
    },
    city:{
        type: String, 
        default: ''
    },
    state:{
        type: String,
        default: ''
    },
    country:{
        type: String,
        default: ''
    },
    zip:{
        type: String,
        default: ''
    }
})

userSchema.virtual('id').get(function(){
    return this._id.toHexString();
});
userSchema.virtual('password').get(function(){
    return this.passwordHash
});

userSchema.set('toJSON',{
    virtuals: true
});

const User = mongoose.model('User', userSchema);


module.exports = userSchema;
module.exports= User;