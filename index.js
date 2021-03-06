const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(
    formidable({
        multiples: true,
    })
);
app.use(cors());

mongoose.connect(process.env.MONGODB_URL,
    // "mongodb://localhost:27017/vinted",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
    });

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
const paymentRoutes = require("./routes/payment");
app.use(userRoutes);
app.use(offerRoutes);
app.use(paymentRoutes);
app.get('/', (req, res) => {
    res.send("it's working");
})
app.all("*", (req, res) => {
    console.log("route not found");
    res.status(404).json("route not found");
});
app.listen(process.env.PORT || 3001, () => {
    console.log("Server Started");
});
