const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY, //ce sont bien mes données.
    api_secret: process.env.CLOUDINARY_API_SECRET,
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
                    return res.json(results);
                }
            } catch (error) {
                return res.json({ error: error.message });
            }
        });
        newOffer.pictures = results;
        await newOffer.save();
        return res.status(200).json("offre publiée");
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
    try {
        const { title, priceMin, priceMax, page, sort } = req.query;
        const pages = Number(page);
        const limit = Number(req.query.limit); // pour rendre dynamique limite

        if (page < 1) {
            pages = 1;
        } else {
            pages = Number(req.query.page);
        }
        const searchByName = new RegExp(title, "i");
        const offers = await Offer.find({
            product_price: { $lte: priceMax ? priceMax : 10000000 },
            product_price: { $gte: priceMin ? priceMin : 0 },
            product_name: searchByName ? searchByName : null,
        })
            .sort({ product_price: sort ? 1 : null })
            .limit({ limit: limit ? limit : 5 }) //dynamique et par default 5
            .skip((pages - 1) * limit);
        const count = await offer.countDocuments(offers); // pour gérer la nombre de doc dans la recherche

        res.status(200).json({ count: count, offers: offers });
    } catch (error) {
        res.status(400).json({ error: error.message });
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
