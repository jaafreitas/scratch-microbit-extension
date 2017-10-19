const os = require('os');

if (os.platform() === 'win32') {
  console.log('Changing noble to noble-uwp');
  var fs = require('fs');
  var f = 'node_modules/noble-device/lib/util.js';

  fs.writeFileSync(f, fs.readFileSync(f).toString().replace('require(\'noble\')', 'require(\'noble-uwp\')'));
}
