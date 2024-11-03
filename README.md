# Virtual Shelly for Hombli Devices

**WORK IN PROGRESS** (actually, work without progress)

>When I first started programming [`oekoboiler-shelly`](https://github.com/johannrichard/oekoboiler-shelly), I started with a Hombli Plug, and this was the conde I inteded to build. However, for reasons I don't recall exactly aynmore (Probably because MyStrom was simpler and quicker to implement than Hombli, and I still had one lying around), I switched to a MyStrom Plug, and essentially abandonded this code-base. Sorry for that. 

[Hombli](https://www.hombli.com) produces are Tuya-based IoT devices like Wi-Fi connected Smart Plugs. Shelly is another brand of Smart Devices which can be controlled via Wi-Fi.

This is a little script to merge (or fake) a Shelly 1 Smart Plug based on a Hombli-Switch with temperature sensors. Any tool, software or device which can interact with a Shelly 1 should then in principle be able to control a Hombli via this script.

To use it, define the following three environment variables:

- `HOMBLI_ID`: your Hombli device's ID
- `HOMBLI_KEY`: your Hombli device's local key
- `HOMBLI_LISTEN_IP`: IP address to listen to
- `HOMBLI_MAC`: the MAC adress to use

If you're unsure about the local key, have a look at `tuyapi`
and the example provided therein to get all your devices' local key.

You must connect the Hombli Devices to the Tuya Cloud to extract the required info. Consult the `tuyapi` for instructions. I can not help with that. Once you have the required ID and Key, this script can run locally.