const puter = require('puter');
console.log('Type of puter:', typeof puter);
console.log('Keys:', Object.keys(puter));
console.log('Is puter.ai available?', !!puter.ai);
if (puter.ai) {
    console.log('Keys of puter.ai:', Object.keys(puter.ai));
}
