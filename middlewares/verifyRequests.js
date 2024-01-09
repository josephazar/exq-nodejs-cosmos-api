const apiBearerToken = process.env.API_BEARER;

module.exports =  (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log("authHeader")
    console.log(authHeader);
    if (token == null) 
        return res.sendStatus(401); // if there is no token in the request, return Unauthorized

    if (token !== apiBearerToken)
        return res.sendStatus(403); // if the token is incorrect, return Forbidden

    next(); // if the token is correct, proceed to the next middleware
};


