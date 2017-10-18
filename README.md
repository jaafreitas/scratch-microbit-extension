This [ScratchX](http://scratchx.org/) extension lets you control your [BBC micro:bit](https://microbit.org/) wirelessly using [Scratch programming blocks](https://scratch.mit.edu/). You can use this new blocks to design a whole new way of interacting with your Scratch projects.

Note: This ScratchX BBC micro:bit extension was developed to extend the operation system plataforms that [oficial extension](https://llk.github.io/microbit-extension/) supports, which only works with Mac OS X at this time.

# Getting Started
Sorry, there is no installer yet, so we need some manual steps.
1. Download the [makecode-microbit-scratch-extension.hex](firmware/makecode-microbit-scratch-extension.hex) and copy it to the BBC micro:bit using a USB cable.
2. Get the [Node.js](https://nodejs.org) if you don't have it yet. Some familiarity with this enviroment is necessary.
3. Clone or download this repository
4. Open a terminal, go to the repository and
```
npm install
```
5. If you are using this on Windows, you need this aditional step:
```
node -e "var fs = require('fs'), `
  f = 'node_modules/noble-device/lib/util.js'; `
  fs.writeFileSync(f, fs.readFileSync(f).toString().replace(`
    'require(\'noble\')', 'require(\'noble-uwp\')'))"
```
6. Start the extension with
```
node index.js
```
7. Launch the BBC micro:bit extension in [English](http://scratchx.org/?url=https://jaafreitas.github.io/scratch-microbit-extension/scratch_microbit.js&lang=en) or [Portuguese](http://scratchx.org/?url=https://jaafreitas.github.io/scratch-microbit-extension/scratch_microbit.js&lang=pt-br)
