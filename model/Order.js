const mongoose = require('mongoose');

const Order = mongoose.model('Order', {
    date: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    delivery: {
        type: Boolean,
        required: true
    },
    products: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

})
module.exports = Order;