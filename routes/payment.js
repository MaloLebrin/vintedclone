const express = require("express");
const router = express.Router();
const createStripe = require("stripe");
const Offer = require('../model/Offer');
const User = require('../model/User');
const Order = require('../model/Order');
const isAuthenticated = require('../middleware/isAuthenticated');
require("dotenv").config;

const stripe = createStripe(process.env.STRIPE_API_SECRET);

// on réceptionne le token
router.post("/payment", isAuthenticated, async (req, res) => {
    try {
        //alller chercher le prix du produit en base de donnée en utilisant l'id du produit
        const { token, title, id, amount } = req.fields
        const offer = await Offer.findById(id)
        console.log("avant if");
        if (offer) {
            const response = await stripe.charges.create({
                amount: offer.product_price * 100,
                currency: "eur",
                description: `Paiement vinted pour : ${title}`,
                source: token,
            });
            console.log("aaprès stripe avant nouvelle commande");
            const newOrder = await new Order({
                date: new Date(),
                amount: offer.product_price,
                delivery: false,
                products: id,
                user: req.user._id,
            })
            console.log("après nouvelle commande avant save");
            await newOrder.save()
            console.log('après save new order');
            const user = await User.findById(req.user._id)
            console.log('après find user');
            user.orders.push(newOrder._id)
            console.log("après push new order to user");
            await user.save()
            console.log("après user save");
            await Offer.findByIdAndDelete(id)
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