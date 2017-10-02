# scratch-microbit-extension
BBC micro:bit Scratch extension

# HOWTO
```
npm install
node -e "var fs = require('fs'), `
  f = 'node_modules/noble-device/lib/util.js'; `
  fs.writeFileSync(f, fs.readFileSync(f).toString().replace(`
    'require(\'noble\')', 'require(\'noble-uwp\')'))"
```
node index.js
