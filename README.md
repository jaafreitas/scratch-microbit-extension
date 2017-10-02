# scratch-microbit-extension
BBC micro:bit Scratch extension

# HOWTO
```
npm install
node -e "var fs = require('fs'), `
  f = 'node_modules/noble-device/lib/util.js'; `
  fs.writeFileSync(f, fs.readFileSync(f).toString().replace(`
    'require(\'noble\')', 'require(\'noble-uwp\')'))"
node index.js
```

Go to http://scratchx.org/, chose Open Extension URL and paste https://jaafreitas.github.io/scratch-microbit-extension/scratch_microbit.js


if you are running a local instance of ScratchX, choose http://localhost:3000/scratch_microbit.js

Read the following bug for more information on how to use extensions locally:
https://github.com/LLK/scratchx/issues/133
