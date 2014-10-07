var fs = require('fs');
var parser = require('./lib/parser');
var ast = parser.parse(fs.readFileSync('test.jak', 'utf8'));

var compile = require('./lib/compiler');

var js = compile(ast);

fs.writeFileSync('out.js', js);
