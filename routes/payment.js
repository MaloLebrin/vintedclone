const express = require("express");
const router = express.Router();
const createStripe = require("stripe");
const Offer = require('../model/Offer');
const User = require('../model/User');
const Order = require('../model/Order');
const isAuthenticated = require('../middleware/isAuthenticated');
require("dotenv").config;

const stripe = createStripe(process.env.STRIPE_API_SECRET);

router.post("/payment", isAuthenticated, async (req, res) => {
    try {
        const { token, title, id, amount } = req.fields
        const offer = await Offer.findById(id)
        console.log("avant if");
        if (offer) {
            const response = await stripe.charges.create({
                amount: (offer.product_price || amount) * 100,
                currency: "eur",
                description: `Paiement vinted pour : ${title}`,
                source: token,
            });
            console.log("aaprès stripe avant nouvelle commande");
            const newOrder = await new Order({
                date: new Date(),
                amount,
                delivery: false,
                products: id,
                user: req.user._id,
            })
            console.log("après nouvelle commande avant save");
            await newOrder.save(); // c'est ici que ça merde 
            console.log('après save new order');
            const user = await User.findById(req.user._id);
            console.log('après find user');
            user.orders.push(newOrder._id);
            console.log("après push new order to user");
            await user.save();
            console.log("après user save");
            await Offer.findByIdAndDelete(id);
            console.log("après delete offer");
            return res.json({
                response: response,
                order: newOrder
            });
        } else {
            return res.status(403).json("ce produit n'existe pas")
        }
    } catch (error) {
        console.log(error.message);
        return res.status(400).json({ error: error.message });
    }
});

module.exports = router;