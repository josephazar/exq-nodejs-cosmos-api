const apiKey = process.env.SOURCE_QNA_KEY;

module.exports =  (req, res, next) => {
    const authKey = req.query.key;

    if (authKey == null) 
        return res.sendStatus(401); // if there is no key in the request url, return Unauthorized

    if (authKey !== apiKey)
        return res.sendStatus(403); // if the key is incorrect, return Forbidden

    next(); // if the token is correct, proceed to the next middleware
};
