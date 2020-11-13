const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
require("dotenv").config;

cloudinary.config({
    cloud_name: "malolebrin",
    api_key: "212971842325324", //ce sont bien mes données.
    api_secret: "79KqyVOwveSqV7PGkTcez9btus4",
});

const User = require("../model/User");
const Offer = require("../model/Offer");
const isAuthenticated = require("../middleware/isAuthenticated");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
    try {
        const {
            description,
            price,
            name,
            brand,
            size,
            color,
            location,
            state,
        } = req.fields;

        const newOffer = await new Offer({
            product_name: name,
            product_description: description,
            product_price: price,
            product_details: [
                { size: size },
                { brand },
                { state: state },
                { color: color },
                { location: location },
            ],
            owner: req.user,
        });
        const fileKeys = Object.keys(req.files.pictures);
        let results = {};
        if (fileKeys.length === 0) {
            res.json("No file uploaded!");
            return;
        }
        fileKeys.forEach(async (fileKey) => {
            try {
                const file = req.files.pictures[fileKey];
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: `vinted/offers/${newOffer._id}`,
                });
                results[fileKey] = {
                    success: true,
                    result: result,
                };
                if (Object.keys(results).length === fileKeys.length) {
                    // tous les uploads sont terminés, on peut donc envoyer la réponse au client
                    newOffer.pictures = results;
                    await newOffer.save()
                    return res.json(results);
                }
                // console.log(results.push(result));

            } catch (error) {
                res.json({ error: error.message });
            }
        }); // forEach s'arrête
        // return res.status(200).json("offre publiée");
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete("/offer/delete", isAuthenticated, async (req, res) => {
    try {
        const offer = await Offer.findOne({ owner: req.user._id }); // retrouve l'offre en fonction de id de l'utilisateur

        await cloudinary.uploader.destroy(offer.pictures.public_id);
        await offer.deleteOne();
        res.json({ message: "offer deleted" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put("/offer/update", isAuthenticated, async (req, res) => {
    try {
        const token = await req.headers.authorization.replace("Bearer ", "");
        const user = await User.findOne({ token }); // utilisateur du token
        const offer = await Offer.findOne({ owner: req.user._id }); // retrouve l'offre en fonction de id de l'utilisateur
        const image = req.files.pictures.path;
        const {
            description,
            price,
            name,
            brand,
            size,
            color,
            location,
            state,
        } = req.fields;

        if (offer) {
            if (image) {
                //si j'ai une image à modifier
                await cloudinary.uploader.upload(
                    image,
                    { folder: `vinted/offers/` },
                    async (error, result) => {
                        console.log(result, error);

                        (offer.product_name = name),
                            //  (offer.product_description = description ? description : offer.product_description ),
                            (offer.product_description = description),
                            (offer.product_price = price),
                            (offer.product_details = [
                                { size: size },
                                { brand },
                                { state: state },
                                { color: color },
                                { location: location },
                            ]),
                            (offer.owner = user.populate("User")),
                            (offer.pictures = result);
                        await offer.save();
                    }
                );
                res.status(200).send("done");
            } else {
                //si j'ai pas d'image à modifier
                (offer.product_name = name),
                    (offer.product_description = description),
                    (offer.product_price = price),
                    (offer.product_details = [
                        { size: size },
                        { brand },
                        { state: state },
                        { color: color },
                        { location: location },
                    ]),
                    (offer.owner = user.populate("User")),
                    await offer.save();
                res.status(200).send("done");
            }
        } else {
            res.status(401).json(`l'offre n'existe pas`);
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get("/offers", async (req, res) => {
    const { title, priceMin, priceMax, page, sort } = req.query;
    if (req.query) {

        try {
            let filters = {};
            if (title || priceMax || priceMin) {
                filters = {
                    product_name: new RegExp(title, "i"),
                    product_price: {
                        $lte: priceMax ? priceMax : 10000,
                        $gte: priceMin ? priceMin : 0,
                    },
                };
            }

            let sortByPrice = {};
            if (sort) {
                sortByPrice = { product_price: sort };
            }

            let skip = 0;
            const limit = 5;
            if (page > 1) {
                skip = page * limit - limit;
            }

            const count = await Offer.countDocuments(filters);

            const result = await Offer.find(filters)
                .populate({
                    path: "owner",
                    select: "account email",
                })
                .select(
                    "product_name product_details product_description product_price product_image.secure_url"
                )
                .sort(sortByPrice)
                .limit(limit)
                .skip(skip);

            return res.status(200).json({ count: count, offers: result });
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    } else {
        try {
            const offers = await Offer.find()
            return res.status(200).json(offers)
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
});

router.get("/offer/:id", async (req, res) => {
    //mettre ces routes avec params à la fin.
    try {
        const getOffer = await Offer.findById(req.params.id).populate({
            path: "owner",
            select: "account _id",
        });

        res.status(200).json(getOffer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
module.exports = router;
