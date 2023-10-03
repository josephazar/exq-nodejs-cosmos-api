const jwt = require('jsonwebtoken');
const secret = 'ceermotorswebapi';
//const token = jwt.sign({ client: 'ceermotors', project: 'qnachatbotwithpva' }, secret);
const token = jwt.sign({ sourceurl:"qnaceer" }, secret);
console.log(token);
