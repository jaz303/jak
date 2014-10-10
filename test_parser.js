var fs = require('fs');
var parser = require('./lib/parser');
var ast = parser.parse(fs.readFileSync('test.jak', 'utf8'));

var compile = require('./lib/compiler');

var js = compile(ast);

var fd = fs.openSync('out.js', 'w');

var runtime = fs.readFileSync(__dirname + '/support/runtime.js')
var code 	= new Buffer(js);
var boot    = fs.readFileSync(__dirname + '/support/boot.js')

fs.writeSync(fd, runtime, 0, runtime.length);
fs.writeSync(fd, code, 0, code.length);
fs.writeSync(fd, boot, 0, boot.length);

fs.closeSync(fd);