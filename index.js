var BBCMicrobit = require('bbc-microbit');
var device = null;
const fs = require('fs');
const path = require('path');

var microbitConnected = false;

var BUTTON_VALUE_MAPPER = ['Not Pressed', 'Pressed', 'Long Press'];

console.log('*** BBC micro:bit Scratch extension ***')

var http = require('http');

var app = http.createServer(function(req, res) {
  console.log('http: read ' + req.url);
  const map = {
    '.xml': 'application/xml',
    '.js': 'application/javascript',
    '.sbx': 'application/octet-stream'
  };
  const ext = path.parse(req.url).ext;

  fs.readFile(__dirname + req.url, function(err, data) {
    if (err) {
      res.statusCode = 404;
      res.end();
    } else {
      res.setHeader('Content-type', map[ext] || 'text/plain');
      res.end(data);
    }
  });
});

var io = require('socket.io').listen(app.listen(3000));
console.log('socket: listening');

io.on('connection', function(socket) {
  console.log('socket: connected');

  socket.emit('socket: connected');
  socket.emit('microbit: connected', microbitConnected);
  if (device) {
    device.readDeviceName(function(error, deviceName) {
      console.log('microbit: ' + deviceName);
      socket.emit('microbit: name', deviceName);
    })
  };

  socket.on('pinSetup', function(data) {
    // console.log('socket: pinSetup');

    if (device) {
      function log(data) {
        console.log('microbit: setup pin %d as %s %s',
          data.pin, data.ADmode, data.IOmode);
      }

      function subscribe(device, data) {
        device.subscribePinData(function(error) {
          log(data);
          // It will trigger a pinDataChange.
          device.readPin(data.pin, function(error, value) {
          });
        });
      };

      if (data.IOmode == 'input') {
        device.pinInput(data.pin, function(error) {
          if (data.ADmode == 'analog') {
            device.pinAnalog(data.pin, function(error) {
              subscribe(device, data);
            });
          } else {
            device.pinDigital(data.pin, function(error) {
              subscribe(device, data);
            });
          };
        });
      } else {
        device.pinOutput(data.pin, function(error) {
          if (data.ADmode == 'analog') {
            device.pinAnalog(data.pin, function(error) {
              log(data);
            });
          } else {
            device.pinDigital(data.pin, function(error) {
              log(data);
            });
          };
        });
      };
    };
  });

  socket.on('pinWrite', function(data) {
    if (device) {
      device.writePin(data.pin, Math.min(data.value, 255), function(error) {
        // console.log('microbit: < pin %d, value %d', data.pin, data.value);
      });
    };
  });

  socket.on('display', function(value) {
    if (device) {
      // The string has to be 20 characters or less.
      // https://github.com/sandeepmistry/node-bbc-microbit/blob/master/API.md#write-text
      device.writeLedText(value.substring(0, 20), function(error) {
        // console.log('microbit: display %s', value);
      });
    };
  });

  socket.on('displayMatrix', function(value) {
    if (device) {
      matrix = new Buffer(value, 'hex');
      device.writeLedMatrixState(matrix);
    };
  });
});

function microbitFound(microbit) {
  console.log('microbit: discovered %s', microbit.address);

  microbit.on('disconnect', function() {
    microbitConnected = false;
    device = null;
    console.log('microbit: connected ' + microbitConnected);
    io.sockets.emit('microbit: connected', microbitConnected);
    microbitScanner();
  });

  microbit.on('buttonAChange', function(value) {
    // console.log('microbit: button A', BUTTON_VALUE_MAPPER[value]);
    io.sockets.emit('microbit: button A', value);
  });

  microbit.on('buttonBChange', function(value) {
    // console.log('microbit: button B', BUTTON_VALUE_MAPPER[value]);
    io.sockets.emit('microbit: button B', value);
  });

  microbit.on('pinDataChange', function(pin, value) {
    // console.log('microbit: > pin %d, value %d', pin, value);
    io.sockets.emit('microbit: pin', { 'pin': pin, 'value': value });
  });

  microbit.on('temperatureChange', function(value) {
    // console.log('microbit: temperature %d', value);
    io.sockets.emit('microbit: temperature', value);
  });

  microbit.on('magnetometerBearingChange', function(value) {
    // console.log('microbit: magnetometer bearing %d', value);
    io.sockets.emit('microbit: magnetometer bearing', value);
  });

  microbit.on('magnetometerChange', function(x, y, z) {
    x = x.toFixed(1);
    y = y.toFixed(1);
    z = z.toFixed(1);
    // console.log('microbit: magnetometer %d, %d, %d', x, y, z);
    io.sockets.emit('microbit: magnetometer', { 'x': x, 'y': y, 'z': z });
  });

  microbit.on('accelerometerChange', function(x, y, z) {
    x = x.toFixed(1);
    y = y.toFixed(1);
    z = z.toFixed(1);
    // console.log('microbit: accelerometer %d, %d, %d', x, y, z);
    io.sockets.emit('microbit: accelerometer', { 'x': x, 'y': y, 'z': z });
  });

  console.log('microbit: connecting...');
  microbit.connectAndSetUp(function() {
    microbitConnected = true;
    device = microbit;
    console.log('microbit: connected ' + microbitConnected);

    microbit.subscribeButtons(function(error) {
      console.log('microbit: subscribed to buttons');
    });

    microbit.writeTemperaturePeriod(1000, function() {
    microbit.subscribeTemperature(function(error) {
      console.log('microbit: subscribed to temperature');
    });
    });

    microbit.writeMagnetometerPeriod(160, function() {
    microbit.subscribeMagnetometerBearing(function(error) {
      console.log('microbit: subscribed to magnetometer bearing');
    });

    microbit.subscribeMagnetometer(function(error) {
      console.log('microbit: subscribed to magnetometer');
    });
    });

    microbit.writeAccelerometerPeriod(160, function() {
    microbit.subscribeAccelerometer(function(error) {
      console.log('microbit: subscribed to accelerometer');
    });
    });

    io.sockets.emit('microbit: connected', microbitConnected);
    microbit.readDeviceName(function(error, deviceName) {
      console.log('microbit: ' + deviceName);
      io.sockets.emit('microbit: name', deviceName);
    })
  });
};

function microbitScanner() {
  console.log('microbit: scanning...');
  BBCMicrobit.discover(microbitFound);
};

microbitScanner();
