const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: "malolebrin",
    api_key: "212971842325324", //ce sont bien mes données.
    api_secret: "79KqyVOwveSqV7PGkTcez9btus4",
});

const User = require("../model/User");

router.post("/user/signup", async (req, res) => {
    try {
        const { email, username, phone, password } = req.fields;
        const allUser = await User.findOne({ email });
        if (allUser) {
            return res.status(409).json("mail already exist");
        } else {
            if (username && email && password) {
                const salt = uid2(16);
                const token = uid2(16);
                const hash = await SHA256(password + salt).toString(encBase64);
                const image = req.files.pictures.path;

                await cloudinary.uploader.upload(
                    image,
                    async (error, result) => {
                        // console.log(result, error);

                        const newUser = await new User({
                            email,
                            account: {
                                username,
                                phone,
                                avatar: result,
                            },
                            hash,
                            token, //ces deux synthaxes sont identiques
                            salt: salt, //ces deux synthaxes sont identiques
                        });
                        await newUser.save();
                        return res.status(200).json(newUser);
                    }
                );
            } else {
                return res.status(500).json({ message: "username manquant" });
            }
        }
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

router.post("/user/login", async (req, res) => {
    try {
        const { email, password } = req.fields;
        const user = await User.findOne({ email });
        if (user && email && password) {
            const newHash = await SHA256(password + user.salt).toString(
                encBase64
            );
            if (user.hash === newHash) {
                return res.status(200).json({
                    token: user.token,
                    account: user.account,
                    email: user.email
                });
            } else {
                return res.status(401).json("entrez le bon mdp");
            }
        } else {
            return res.status(400).json(`entrez le bon mail d'utilisateur`);
        }
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

module.exports = router;
