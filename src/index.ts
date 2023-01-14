/**
 * Little script to merge (or fake) an Heatpump Boiler as a Shelly 1
 * with temperature sensors
 *
 * To use it, define the following three environment variables:
 *
 * TUYA_ID: your Tuya device's ID
 * TUYA_KEY: your Tuya device's local key
 * TUYA_SERVER_IP: IP address to listen to
 * TUYA_MAC: the MAC adress to use
 *
 * If you're unsure about the local key, have a look at `tuyapi`
 * and the example provided therein to get all your devices' local key
 */
import TuyAPI from 'tuyapi';
import TuyaDevice from 'tuyapi';
import randomMac from 'random-mac';
import { CoapServer, HttpServer } from 'fake-shelly';
import { Shelly1PM } from 'fake-shelly/devices';
import 'dotenv/config';

const mac = process.env.TUYA_MAC || randomMac('00:40:4f');
const interval = 5;

class TuyaShelly extends Shelly1PM {
  private upstreamTuyaDevice: TuyaDevice = new TuyAPI({
    id: process.env.TUYA_ID!,
    key: process.env.TUYA_KEY!,
  });

  constructor(id: string) {
    super(id);

    this.macAddress = id;
    // Remove event emitter
    this.removeListener('change:relay0');

    // Add new listener
    this.on('change:relay0', (newValue) => {
      // Must trickle this down, i.e. set relay of upstream Shelly
    });

    // Find device on network
    this.upstreamTuyaDevice.find().then(() => {
      // Connect to device
      this.upstreamTuyaDevice.connect().then(() => {
        setInterval(() => {
          // Device will emit changed values
          this.upstreamTuyaDevice.refresh({});
        }, interval * 1000);
      });
    });

    /**
      {
        dps: {
          '1': true, ON/OFF
          '9': 0,
          '17': 32,
          '18': 297,
          '19': 558, Power (A/10 = 55.8)
          '20': 2232, Voltage (V/10 = 223.2)
          '21': 1,
          '22': 550,
          '23': 27324,
          '24': 14557,
          '25': 2860,
          '26': 0
        }
      }
       
       */

    this.upstreamTuyaDevice.on('data', (data) => {
      // Updates only update single values
      if (data!.dps && '1' in data.dps) {
        this.relay0 = data.dps['1'];
      }

      if (data!.dps && '19' in data.dps) {
        var power: number = data.dps['19'] as number;
        this.powerMeter0 = power / 10;
      }
    });

    this.upstreamTuyaDevice.on('dp-refresh', (data) => {
      if (data!.dps && '19' in data.dps) {
        var power: number = data.dps['19'] as number;
        this.powerMeter0 = power / 10;
      }
    });
  }

  protected _getHttpSettings() {
    return {
      sensors: {
        temperature_threshold: 1,
        temperature_unit: 'C',
      },
      relays: [this._getRelay0HttpSettings()],
      meters: [this._getPowerMeter0HttpSettings()],
      ext_sensors: {
        temperature_unit: 'C',
      },
      ext_temperature: {},
    };
  }

  protected _getHttpStatus() {
    return {
      relays: [this._getRelay0HttpStatus()],
      meters: [this._getPowerMeter0HttpStatus()],
      tmp: {},
      ext_sensors: {
        temperature_unit: 'C',
      },
      ext_temperature: {
        0: {
          hwID: 0,
          tC: this.temperature,
          tF: (this.temperature * 9) / 5 + 32,
        },
      },
    };
  }
}

let tuya;

try {
  tuya = new TuyaShelly(mac);
  console.log(
    `▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
██░▄▄▄░█░▄▄█░█▀█▀▄▄▀█░▄▄▀█▀▄▄▀██▄██░██░▄▄█░▄▄▀███░█░████░▄▄▄░█░████░▄▄█░██░██░██░██
██░███░█░▄▄█░▄▀█░██░█░▄▄▀█░██░██░▄█░██░▄▄█░▀▀▄███▀▄▀████▄▄▄▀▀█░▄▄░█░▄▄█░██░██░▀▀░██
██░▀▀▀░█▄▄▄█▄█▄██▄▄██▄▄▄▄██▄▄██▄▄▄█▄▄█▄▄▄█▄█▄▄███▄█▄████░▀▀▀░█▄██▄█▄▄▄█▄▄█▄▄█▀▀▀▄██
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`,
  );
  console.log('------------------------------');
  console.log('Shelly:     ', tuya.type);
  console.log('ID:         ', tuya.id);
  console.log('Tuya ID:    ', process.env.TUYA_ID);
  console.log('Tuya IP:    ', process.env.TUYA_IP);
  console.log('Listen IP:  ', process.env.TUYA_LISTEN_IP || 'all interfaces');
  console.log('------------------------------');
  console.log('');

  const coapServer = new CoapServer(tuya);
  const httpServer = new HttpServer(tuya);

  coapServer
    .start()
    .then(() => {
      console.log('CoAP server started');
    })
    .catch((error) => {
      console.error('Failed to start CoAP server:', error);
    });

  httpServer
    .start(process.env.TUYA_LISTEN_IP)
    .then(() => {
      console.log(`HTTP server started on ${process.env.TUYA_LISTEN_IP || "all ip addresses"}`);
    })
    .catch((error) => {
      console.error('Failed to start HTTP server:', error);
    });
} catch (e) {
  if (e instanceof Error) console.error('Failed to create device:', e.message);
}
