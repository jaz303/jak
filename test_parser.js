var fs = require('fs');
var parser = require('./lib/parser');
var ast = parser.parse(fs.readFileSync('test.jak', 'utf8'));

console.log(require('util').inspect(ast, {colors:true, depth: null}));