var artikCloud = "https://api.artik.cloud/v1.1/messages";

//device info
var motionBearer = "Bearer INSERT_DEVICE_TOKEN";
var motionId = "INSERT_DEVICE_ID";


var motion_data = "Motion_Detected";

//BLE stuffs
var noble = require('noble');
var exitHandlerBound = false;
var maxPeripherals = 4;
var peripherals = [];
var motion = 0;
var deviceMapping = {};

var discover = function(peripheral){
  console.log('scan found: ' + peripheral.advertisement.localName + ' - UUID ' + peripheral.advertisement.uuid);
  deviceMapping[peripheral.uuid] = peripheral.advertisement.localName;
  peripheral.connect(connect.bind({peripheral:peripheral}));
}

var connect = function (err) {
  if (err) throw err;
  console.log("Connection to : " + this.peripheral.uuid);
  peripherals[peripherals.length] = this.peripheral;

  if (peripherals.length >= maxPeripherals){
    console.log("Stopping BLE scan. Reached " + maxPeripherals + " peripherals");
    noble.stopScanning();
  }

  if (!exitHandlerBound){
    exitHandlerBound = true;
    process.on('SIGINT', exitHandler);
  }
  this.peripheral.discoverServices([], setupService);
};

var setupService = function(err, services) {
  if (err) throw err;
  services.forEach(function(service){
    console.log(service.uuid);
    if (service.uuid === '19b10030e8f2537e4f6cd104768a1214') {
      console.log('found motion sensor UUID');
      var characteristicUUIDs= ['19b10032e8f2537e4f6cd104768a1214'];
      service.discoverCharacteristics(characteristicUUIDs, function(err, characteristics){
        console.log('got characteristics');
        requestNotify(characteristics[0]);
      });
    }
  });
};

var requestNotify = function(characteristic){
  characteristic.on('read', function(data, isNotification){
    console.log('characteristic read');
    motion = (data[1] << 8)+ data[0];
    console.log("motion is " + motion);
    postToCloud();
  });
  characteristic.notify(true, function(err){
    console.log('turned on notifications ' + (err ? 'with error' : 'without error'));
  });
}



var exitHandler = function exitHandler(){
  peripherals.forEach(function(peripheral){
    peripheral.disconnect(function(){
      console.log('disconnected');
    });
  });

  setTimeout(function(){
    process.exit();
  }, 2000);
}

noble.on('stateChange', function(state){
  if (state === 'poweredOn'){
    noble.startScanning(['19b10030e8f2537e4f6cd104768a1214'], false);
    noble.on('discover', discover);
  } else {
    noble.stopScanning();
  }
});



//REST client
var Client = require('node-rest-client').Client;
var c = new Client();

function build_args (measurement, measurement_Type, ts, bearer, sdid) {
  var args = {
    headers: {
      "Content-Type": "application/json",
      "Authorization": bearer
    },
    data: {
      "sdid": sdid,
      "ts": ts,
      "type": "message",
      "data": {
        [measurement_Type]: measurement
      }
    }
  };
  return args;
}

var postToCloud = function(){
    console.log("writing to cloud");
    var test_motion = build_args(motion, motion_data, new Date().valueOf(), motionBearer, motionId);
    c.post(artikCloud, test_motion, function(data, response){
      console.log(data);
      console.log(new Date().toString());
    });
};
