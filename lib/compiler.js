module.exports = compile;

function compile(ast) {

	var out = '';
	var _indent = 0;

	function indent() { _indent++; }
	function outdent() { _indent--; }

	function writeln() {
		for (var i = 0; i < _indent; ++i) {
			out += '    ';
		}
		out += (Array.prototype.slice.call(arguments).join('')) + "\n";
	}

	ast.forEach(function(fn) {
		compileFunctionDefinition(fn);
	});

	function compileStatements(stmts) {
		stmts.forEach(compileStatement);
	}

	function compileExpression(exp) {
		switch (exp.nodeType) {
			case 'boolean':
				return exp.value ? 'true' : 'false';
			case 'ident':
				return exp.name;
			case 'function-call':

				var call = [
					compileExpression(exp.fn),
					'(',
					exp.args.map(compileExpression),
					')'
				].join('');	

				// Giant hack
				// we don't have a typechecker yet so just hardcode
				// the names of async functions :)
				if (exp.fn.nodeType === 'ident' && ['delay'].indexOf(exp.fn.name) >= 0) {
					return 'yield ' + call;
				} else {
					return call;
				}

			case 'integer':
				return '' + exp.value;
			case 'make-channel':
				return '$jak_makeChannel()'
			default:
				return 'exp:' + exp.nodeType;
		}
	}

	function compileVariableDeclaration(stmt) {
		var decl = 'var ' + stmt.name;
		if (stmt.defaultValue !== void 0) {
			decl += ' = ' + compileExpression(stmt.defaultValue);
		}
		writeln(decl + ';');
	}

	function compileWhileStatement(stmt) {
		writeln('while (' + compileExpression(stmt.condition) + ') {');
		indent();
		compileStatements(stmt.body);
		outdent();
		writeln('}');
	}

	function compileChannelOp(stmt) {
		if (stmt.op === 'put') {
			writeln(
				'(',
				compileExpression(stmt.right),
				').put(',
				compileExpression(stmt.left),
				');'
			)
		} else if (stmt.op === 'take') {
			writeln(
				compileExpression(stmt.left),
				' = ',
				'yield (' + compileExpression(stmt.right) + ').take();'
			)
		} else {
			throw new Error("unknown channel op: " + stmt.op);
		}
	}

	function compileSpawn(stmt) {
		writeln(
			'$jak_spawn(',
			compileExpression(stmt.fn),
			'(',
			stmt.args.map(compileExpression).join(', '),
			'));'
		);
	}

	function compileReturn(stmt) {
		if (stmt.exp === void 0) {
			writeln('return;');
		} else {
			writeln('return ' + compileExpression(stmt.exp) + ';');
		}
	}

	function compileStatement(stmt) {
		switch (stmt.nodeType) {
			case 'var-decl':
				compileVariableDeclaration(stmt);
				break;
			case 'while':
				compileWhileStatement(stmt);
				break;
			case 'spawn':
				compileSpawn(stmt);
				break;
			case 'channel-op':
				compileChannelOp(stmt);
				break;
			case 'return':
				compileReturn(stmt);
				break;
			default:
				writeln(compileExpression(stmt) + ';');
				break;
		}
	}

	function compileFunctionDefinition(fn) {

		var pre = 'function';
		if (fn.async) {
			pre += '*';
		}
		pre += ' ' + fn.name;

		pre += '(';
		pre += fn.args.map(function(a) { return a.name; }).join(', ');
		pre += ') {';

		writeln(pre);

		indent();
		compileStatements(fn.body);
		outdent();

		writeln('}');

		writeln('');

	}

	return out;

}