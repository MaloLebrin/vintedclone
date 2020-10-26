const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
    product_name: {
        type: String,
        required: true,
        maxlength: [20, "max caracters 10"],
    },
    product_description: {
        type: String,
        maxlength: [500, "max caracters is 500"],
    },
    product_price: Number,
    product_details: Array,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    pictures: Object,
});

module.exports = Offer;
