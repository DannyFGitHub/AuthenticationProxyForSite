const Whitelist = require('./Whitelist.js');

if(process.argv[2]){
    let email = process.argv[2];
    Whitelist.create(email);
}
