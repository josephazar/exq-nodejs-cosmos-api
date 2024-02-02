// authRouter.js
var express = require('express');
var router = express.Router();

var tokenValidationCache = new Map();
const azureConfig=require('../azure.conf.json')
const passport = require('passport');
const BearerStrategy = require('passport-azure-ad').BearerStrategy;



var languageController = require('../controllers/qnalanguage.controller');


const options = {
    // https://login.microsoftonline.com/<your_tenant_guid>/.well-known/openid-configuration
    identityMetadata: `https://${azureConfig.metadata.authority}/${azureConfig.credentials.tenantID}/${azureConfig.metadata.version}/${azureConfig.metadata.discovery}`,
    
    /**
     * Required if you are using common endpoint and setting `validateIssuer` to true.
     * For tenant-specific endpoint, this field is optional, we will use the issuer from the metadata by default.
     * issuer: `https://${azureConfig.metadata.authority}/${azureConfig.credentials.tenantID}/${azureConfig.metadata.version}`,
     */
    // @ts-ignore
    issuer: null,

    validateIssuer: azureConfig.settings.validateIssuer,

    clientID: azureConfig.credentials.clientID,

    audience: azureConfig.credentials.audience,

    passReqToCallback: azureConfig.settings.passReqToCallback,

    loggingLevel: azureConfig.settings.loggingLevel,

    scope: azureConfig.resource.scope,

    // If this is set to true, no personal information such as tokens and claims will be logged. The default value is true.
    loggingNoPII: false,

    /**
     * This value is the clock skew (in seconds) allowed in token validation. It must be a positive integer.
     * The default value is 300 seconds.
     */
    clockSkew: 100000
};

const bearerStrategy = new BearerStrategy(options, (token, done) => {
    // Verifying the user
    /**
      *  You can use a function here that will lookup the users and add additional information to the user
      *  object.
     **/

   
    // console.log('///////////////////////////////////////')
    // console.log('///////////////////////////////////////')
    // console.log('///////////////////////////////////////')
    const roles = token.roles || [];

    // You can now use the roles array as needed, e.g., to check for specific roles
    // console.log('User Roles:', roles);
    const user = {};
    // Send user info using the second argument
    // console.log('token', token);
    
    return done(null, user, token);
});

passport.use(bearerStrategy);

router.use(passport.initialize());

router.use(passport.authenticate('oauth-bearer', { session: false }), (req, res, next) => {
    // console.log('req.authInfo', req.authInfo);
    res.locals.authInfo = req.authInfo;
    return next();
});


router.get('/source', languageController.getQnAHtml);
router.post('/knowledgebase', languageController.chatbotqaAdd);
router.delete('/knowledgebase/:id', languageController.chatbotqaDelete);
router.post('/knowledgebase/deploy', languageController.chatbotqaUpdateSource);
router.post('/init', languageController.initMongoDbQNA);
router.put('/knowledgebase',languageController.chatbotqaUpdate)
router.get('/knowledgebase', languageController.getQNA);
router.get('/protected',(req, res) => {
    res.send({'res':'Hello! This resource is protected.'})
}
)

module.exports = router;

