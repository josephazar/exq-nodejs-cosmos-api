// authRouter.js
var express = require('express');
var router = express.Router();

var tokenValidationCache = new Map();
const azureConfig=require('../azure.conf.json')
const passport = require('passport');
const BearerStrategy = require('passport-azure-ad').BearerStrategy;



var languageController = require('../controllers/qnalanguage.controller');


const options = {

    identityMetadata: `https://${azureConfig.metadata.authority}/${azureConfig.credentials.tenantID}/${azureConfig.metadata.version}/${azureConfig.metadata.discovery}`,
    issuer: null,
    validateIssuer: azureConfig.settings.validateIssuer,
    clientID: azureConfig.credentials.clientID,
    audience: azureConfig.credentials.audience,
    passReqToCallback: azureConfig.settings.passReqToCallback,
    loggingLevel: azureConfig.settings.loggingLevel,
    scope: azureConfig.resource.scope,
    loggingNoPII: false,
    clockSkew: 300
};

const bearerStrategy = new BearerStrategy(options, (token, done) => {
    const roles = token.roles || [];
    const user = {};
    return done(null, user, token);
});

passport.use(bearerStrategy);
router.use(passport.initialize());
router.use(passport.authenticate('oauth-bearer', { session: false }), (req, res, next) => {
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

