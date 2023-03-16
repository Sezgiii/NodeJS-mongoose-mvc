const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name : {
        type: String,
        required: [true, 'Ürün ismi girmelisiniz.'],
        minlength: [5, 'Ürün ismi için minimum 5 karakter girmelisiniz.'],
        maxlength :  [255, 'Ürün ismi için maksimum 255 karakter girmelisiniz.'],
        capitalize: true,        
        // uppercase: true,   
        trim: true  
    },
    price: {
        type: Number,
        required: function(){
            return this.isActive; 
        },
        min: [0, 'Ürünün fiyatı için minimum 0 girmelisiniz.'],
        max: [50000, 'Ürünün fiyatı için maksimum 50000 girmelisiniz.'],
        get: value => Math.round(value),   
        set: value => Math.round(value)    
    },
    description: {
        type: String,
        minlength : [10, 'Ürün açıklaması için minimum 10 karakter girmelisiniz.']
    },
    image: String,
    date: {
        type: Date,
        default: Date.now
    },
    userId: {  
        type : mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    tags: {
        type: Array,
        validate:{
            validator: function(value){
                return value && value.length > 0; 
            },
            message: 'Ürün için en az bir etiket giriniz.'   
        }
    },
    isActive: Boolean,
    categories: [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: false
        }
    ]
});

module.exports = mongoose.model('Product', productSchema); 