const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true, 
    },
    icon:{
        type: String
    },
    color:{
        //#000 format
        type: String
    },
    // image:{
        
    //     type: String
    // },
})


const Category = mongoose.model('Category', categorySchema)

module.exports = Category;