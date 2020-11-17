const User = require("../model/User");
const isAuthenticated = async (req, res, next) => {
    if (req.headers.authorization) {
        const token = await req.headers.authorization.replace("Bearer ", "");
        const user = await User.findOne({ token: token }).select(
            "account _id token" //champ qui nous interesse dans un string avec un espace entre chaque champ.
        ); // le select permettrai d'isoler certaines clefs et doncc leur valeurs pour par exemple ne pas renvoyer le hash et le salt
        if (!user) {
            return res.status(401).json({ error: "user not found" });
        } else {
            req.user = user;
            return next();
        }
    } else {
        return res.status(401).json({ error: "non authorizé" });
    }
};

module.exports = isAuthenticated;
