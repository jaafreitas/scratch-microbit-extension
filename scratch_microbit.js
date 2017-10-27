(function(ext) {
  var socket = null;
  var socketConnected = false;
  var microbitConnected = false;
  var microbitDeviceName = null;

  const BTN_UP = 0,
    BTN_DOWN = 1,
    BTN_HELD = 2;

  var buttonState = null;
  var matrixState = null;
  var pinValue = null;
  var pinSetup = null;
  var temperature = null;
  var magnetometerBearing = null;
  var magnetometer = null;
  var accelerometer = null;
  const compassPoint = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW"
  ];

  function initValues () {
    buttonState = {A: 0, B: 0};
    matrixState = [0, 0, 0, 0, 0];
    // The array has space for P0 to P20 (including P17 and P18).
    pinValue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    pinSetup = [
      false, false, false, false, false, false, false, false, false, false, false,
      false, false, false, false, false, false, false, false, false, false
    ];
    temperature = 0;
    magnetometerBearing = 0;
    magnetometer = { 'x': 0, 'y': 0, 'z': 0 };
    accelerometer = { 'x': 0, 'y': 0, 'z': 0 };
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

    socket.on('microbit: name', function(value) {
      microbitDeviceName = value;
      // console.log('microbit: %s', value);
    });


    socket.on('microbit: button A', function(status) {
      // console.log('microbit: button A ' + status);
      buttonState['A'] = status;
    });

    socket.on('microbit: button B', function(status) {
      // console.log('microbit: button B ' + status);
      buttonState['B'] = status;
    });

    socket.on('microbit: pin', function(data) {
      // console.log('microbit: pin %d, value %d', data.pin, data.value);
      pinValue[data.pin] = data.value;
    });

    socket.on('microbit: temperature', function(value) {
      // console.log('microbit: temperature %d', value);
      temperature = value;
    });

    socket.on('microbit: magnetometer bearing', function(value) {
      // console.log('microbit: magnetometer bearing %d', value);
      magnetometerBearing = value;
    });

    socket.on('microbit: magnetometer', function(data) {
      // console.log('microbit: magnetometer %s, %s, %s', data.x, data.y, data.z);
      magnetometer = data;
    });

    socket.on('microbit: accelerometer', function(data) {
      // console.log('microbit: accelerometer %s, %s, %s', data.x, data.y, data.z);
      accelerometer = data;
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
      // console.log('microbit: pinSetup %s, ADmode %s, IOmode %s', pin, ADmode, IOmode);
      socket.emit('pinSetup', {'pin': pin, 'ADmode': ADmode, 'IOmode': IOmode});
      pinSetup[pin] = true;
    };
  };

  function pinWrite(pin, value) {
    if (microbitConnected) {
      // console.log('microbit: pinWrite %s, value %s', pin, value);
      socket.emit('pinWrite', {'pin': pin, 'value': value});
    };
  }

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

  ext.analogWritePin = function(pin, value) {
    setupPin(pin, 'analog', 'output');
    pinWrite(pin, value);
  };

  ext.digitalWritePin = function(pin, value) {
    setupPin(pin, 'digital', 'output');
    // We don't want to deal with translation issues.
    value = (value == menus.digitalPinValues[1]);
    pinWrite(pin, value);
  };

  ext.temperature = function() {
    return temperature;
  }

  ext.magnetometerBearing = function() {
    return magnetometerBearing;
  }

  ext.magnetometer = function(axis) {
    return magnetometer[axis];
  }

  ext.accelerometer = function(axis) {
    return accelerometer[axis];
  }

  ext.compass = function() {
    var d = magnetometerBearing / (360 / 16);
    var nameIndex = Math.floor(d);
    if (d - nameIndex > 0.5) {
        nameIndex++;
    }
    if (nameIndex > 15) {
        nameIndex = 0;
    }
    return compassPoint[nameIndex];
  }

  ext.display = function(value) {
    if (microbitConnected) {
      // console.log('microbit: display %s', value);
      socket.emit('display', value);
    };
  };

  plotUnPlotLED = function(x, y, plot) {
    x = parseInt(x);
    if (isNaN(x) | x < 0 | x > 4) return;
    y = parseInt(y);
    if (isNaN(y) | y < 0 | y > 4) return;
    if (plot) {
      matrixState[y] |= 1 << 4 - x;
    } else {
      matrixState[y] &= ~(1 << 4 - x);
    }
    // console.log('microbit: display matrix %s', (matrixState[y] >>> 0).toString(2));
    socket.emit('displayMatrix', matrixState);
  };

  ext.plotLED = function(x, y) {
    plotUnPlotLED(x, y, true);
  };

  ext.unplotLED = function(x, y) {
    plotUnPlotLED(x, y, false);
  };

  ext.pointLED = function(x, y) {
    return matrixState[y] >> (4 - x) & 1;
  }

  ext.clearDisplay = function() {
    matrixState = [0, 0, 0, 0, 0];
    socket.emit('displayMatrix', matrixState);
  }

  ext.deviceName = function(axis) {
    return microbitDeviceName;
  };

  // Check for GET param 'lang'
  var paramString = window.location.search.replace(/^\?|\/$/g, '');
  var vars = paramString.split("&");
  var lang = 'en';
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (pair.length > 1 && pair[0] == 'lang') {
      lang = pair[1];
    }
  };

  var blocks = {
    'en': [
      ['h', 'when %m.btns button pressed', 'whenButtonPressed', 'A'],
      [' '],
      [' ', 'display %s', 'display', '?'],
      [' ', 'plot x %d.rowcol y %d.rowcol', 'plotLED', 0, 0],
      [' ', 'unplot x %d.rowcol y %d.rowcol', 'unplotLED', 0, 0],
      ['r', 'point x %d.rowcol y %d.rowcol', 'pointLED', 0, 0],
      [' ', 'clear display', 'clearDisplay'],
      [' '],
      ['r', 'analog read pin %m.analogPins', 'analogReadPin', 0],
      ['b', 'digital read pin %m.digitalPins', 'digitalReadPin', 0],
      [' ', 'analog write pin %m.analogPins to %d', 'analogWritePin', 0, 255],
      [' ', 'digital write pin %m.digitalPins to %m.digitalPinValues', 'digitalWritePin', 0, 'on'],
      [' ', 'reset pins', 'resetPins'],
      [' '],
      ['r', 'temperature', 'temperature'],
      ['r', 'magnetometer bearing', 'magnetometerBearing'],
      ['r', 'magnetometer %m.axis', 'magnetometer', 'x'],
      ['r', 'compass', 'compass'],
      ['r', 'accelerometer %m.axis', 'accelerometer', 'x'],
      ['r', 'device', 'deviceName']
    ],
    'pt-br': [
      ['h', 'Quando o botão %m.btns for pressionado', 'whenButtonPressed', 'A'],
      [' '],
      [' ', 'mostre %s', 'display', '?'],
      [' ', 'marque x %d.rowcol y %d.rowcol', 'plotLED', 0, 0],
      [' ', 'desmarque x %d.rowcol y %d.rowcol', 'unplotLED', 0, 0],
      ['r', 'valor do ponto x %d.rowcol y %d.rowcol', 'pointLED', 0, 0],
      [' ', 'limpe tela', 'clearDisplay'],
      [' '],
      ['r', 'leitura analógica do pino %m.analogPins', 'analogReadPin', 0],
      ['b', 'leitura digital do pino %m.digitalPins', 'digitalReadPin', 0],
      [' ', 'escrita analógica do pino %m.analogPins para %d', 'analogWritePin', 0, 255],
      [' ', 'escrita digital pino %m.digitalPins para %m.digitalPinValues', 'digitalWritePin', 0, 'on'],
      [' ', 'reinicie os pinos', 'resetPins'],
      [' '],
      ['r', 'temperatura', 'temperature'],
      ['r', 'magnetômetro', 'magnetometerBearing'],
      ['r', 'magnetômetro eixo %m.axis', 'magnetometer', 'x'],
      ['r', 'bússola', 'compass'],
      ['r', 'acelerômetro %m.axis', 'accelerometer', 'x'],
      ['r', 'dispositivo', 'deviceName']
    ]
  };

  var menus = {
    'en': {
      btns: ['A', 'B', 'any'],
      // there are no pins 17 and 18.
      analogPins: [0, 1, 2, 3, 4, 10],
      digitalPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 19, 20],
      digitalPinValues: ['off', 'on'],
      axis: ['x', 'y', 'z'],
      rowcol: [0, 1, 2, 3, 4]
    },
    'pt-br': {
      btns: ['A', 'B', 'qualquer'],
      // there are no pins 17 and 18.
      analogPins: [0, 1, 2, 3, 4, 10],
      digitalPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 19, 20],
      digitalPinValues: ['desligado', 'ligado'],
      axis: ['x', 'y', 'z'],
      rowcol: [0, 1, 2, 3, 4]
    }
  }

  var descriptor = {
    blocks: blocks[lang],
    menus: menus[lang],
    url: 'https://jaafreitas.github.io/scratch-microbit-extension'
  };

  ScratchExtensions.register('BBC micro:bit', descriptor, ext);
})({});
