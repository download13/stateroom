var fs = require('fs');
var babel = require('babel-core');


compile('index.es6.js', 'index.js');
compile('server/index.es6.js', 'server/index.js');
compile('server/clients/websocket.es6.js', 'server/clients/websocket.js');
compile('client/index.es6.js', 'client/index.js');
compile('common/index.es6.js', 'common/index.js');
compile('common/constants.es6.js', 'common/constants.js');


function compile(from, to) {
	babel.transformFile(from, {
		presets: ['babel-preset-es2015'],
		plugins: ['babel-plugin-transform-object-rest-spread']
	}, function(err, res) {
		if(err) {
			throw err;
		}

		fs.writeFile(to, res.code);
	})
}
