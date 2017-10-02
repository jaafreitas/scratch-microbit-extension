(function(ext) {
  var socket = null;
  var socketConnected = false;
  var microbitConnected = false;

  var BTN_UP = 0,
    BTN_DOWN = 1,
    BTN_HELD = 2;

  var buttonState = {A: 0, B: 0};

  console.log('*** BBC micro:bit Scratch extension ***')

  connectToSocket();

  function connectToSocket() {
    console.log('socket: connecting...');
    if (socketConnected) return;
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    socket = io.connect('http://localhost:3000', {forceNew: true});

    socket.on('socket: connected', function() {
      console.log('socket: connected');
      socketConnected = true;
    });

    socket.on('connect_error', function(){
      console.log('socket: error');
      socket.disconnect();
      socket = null;
      socketConnected = false;
      microbitConnected = false;
      window.setTimeout(function() {
        connectToSocket();
      }, 1000);
    });

    socket.on('microbit: connected', function(status) {
      microbitConnected = status;
      console.log('microbit: connected ' + microbitConnected);
    });

    socket.on('microbit: button A', function(status) {
      console.log('microbit: button A ' + status);
      buttonState['A'] = status;
    });

    socket.on('microbit: button B', function(status) {
      console.log('microbit: button B ' + status);
      buttonState['B'] = status;
    });
  }

  ext._shutdown = function() {
    socket.disconnect();
  };

  ext._getStatus = function() {
    if (!socketConnected)
      return { status: 0, msg: 'Service is down?' };
    if (!microbitConnected)
      return { status: 1, msg: 'No BBC micro:bit found' };
    return {status: 2, msg: 'Ready'}
  };

  ext.whenButtonPressed = function(btn) {
    if (btn === 'any')
      return buttonState['A'] == BTN_DOWN | buttonState['B'] == BTN_DOWN;
    return buttonState[btn] == BTN_DOWN;
  };

  var blocks = [
    ['h', 'when %m.btns button pressed', 'whenButtonPressed', 'A']
  ];

  var menus = {
    btns: ['A', 'B', 'any']
  };

  var descriptor = {
    blocks: blocks,
    menus: menus,
    url: 'https://github.com/jaafreitas/scratch-microbit-extension'
  };

  ScratchExtensions.register('BBC micro:bit', descriptor, ext);
})({});
