const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
require("dotenv").config;

app.use(
    formidable({
        multiples: true,
    })
);
app.use(cors());

mongoose.connect("mongodb://localhost:27017/vinted", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
});

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);
app.use(offerRoutes);

app.all("*", (req, res) => {
    console.log("route not found");
    res.status(404).json("route not found");
});
app.listen(process.env.PORT, () => {
    console.log("Server Started");
});
