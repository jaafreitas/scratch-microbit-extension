(function(ext) {
  var socket = null;
  var socketConnected = false;
  var microbitConnected = false;

  var BTN_UP = 0,
    BTN_DOWN = 1,
    BTN_HELD = 2;

  var buttonState = null;
  var pinValue = null;
  var pinSetup = null;

  function initValues () {
    buttonState = {A: 0, B: 0};
    // The array has space for P0 to P20 (including P17 and P18).
    pinValue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    pinSetup = [
      false, false, false, false, false, false, false, false, false, false, false,
      false, false, false, false, false, false, false, false, false, false
    ];
  }
  initValues();

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
      initValues();
      window.setTimeout(function() {
        connectToSocket();
      }, 1000);
    });

    socket.on('microbit: connected', function(status) {
      microbitConnected = status;
      initValues();
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

    socket.on('microbit: pin', function(data) {
      console.log('microbit: pin %d, value %d', data.pin, data.value);
      pinValue[data.pin] = data.value;
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

  function setupPin(pin, ADmode, IOmode) {
    if ((microbitConnected) && (!pinSetup[pin])) {
      console.log('microbit: pinSetup %d, type %s, read %s', pin, ADmode, IOmode);
      socket.emit('pinSetup', {'pin': pin, 'ADmode': ADmode, 'IOmode': IOmode});
      pinSetup[pin] = true;
    };
  };

  ext.resetPins = function() {
    initValues();
  };

  ext.analogReadPin = function(pin) {
    setupPin(pin, 'analog', 'input');
    return pinValue[pin];
  };

  ext.digitalReadPin = function(pin) {
    setupPin(pin, 'digital', 'input');
    return pinValue[pin];
  };

  var blocks = [
    ['h', 'when %m.btns button pressed', 'whenButtonPressed', 'A'],
    ['', 'reset pins', 'resetPins'],
    ['r', 'analog read pin %d.analogPins', 'analogReadPin', '0'],
    ['b', 'digital read pin %d.digitalPins', 'digitalReadPin', '0']
  ];

  var menus = {
    btns: ['A', 'B', 'any'],
    // there are no pins 17 and 18.
    analogPins: [0, 1, 2, 3, 4, 10],
    digitalPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 19, 20]
  };

  var descriptor = {
    blocks: blocks,
    menus: menus,
    url: 'https://github.com/jaafreitas/scratch-microbit-extension'
  };

  ScratchExtensions.register('BBC micro:bit', descriptor, ext);
})({});
