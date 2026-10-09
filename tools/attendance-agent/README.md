# Kiddiewise gate agent

A small program for the school computer that is cabled to the ZKTeco fingerprint device. It reads
each scan off the device and sends it to Kiddiewise, which marks the student's register and tells
their guardians in the parent portal when they arrived and left.

```
fingerprint device --cable--> school computer (this agent) --internet--> Kiddiewise
```

Nothing is lost while the computer is off or offline: scans stay on the device until the agent
reads them, and the agent only moves on once Kiddiewise has accepted them. Parents' notices for that
stretch arrive late rather than not at all.

## What it needs

- Windows, on the same cable as the device (the device is at `192.168.0.201`, port `4370`).
- Internet on that computer (Wi-Fi is fine).
- Python 3.10 or newer.
- The device added in Kiddiewise under **Attendance → Settings → Devices**, which shows the
  server address and the device key once.

## Install

1. **Python.** Install it from python.org. On the first screen of the installer, tick
   *Add python.exe to PATH*.
2. **Copy this folder** to `C:\Kiddiewise\gate-agent`.
3. **Set it up.** Open Command Prompt and run:
   ```
   cd C:\Kiddiewise\gate-agent
   python -m venv .venv
   .venv\Scripts\pip install -r requirements.txt
   ```
4. **Configure it.** Copy `config.example.ini` to `config.ini` and fill in `url` and `key` under
   `[server]` with the two values Kiddiewise showed when the device was added. The `[device]`
   values are already this school's.
5. **Test it.** Close ZKTime first (the device may only accept one connection at a time), then:
   ```
   .venv\Scripts\python agent.py --test
   ```
   Both lines should end in `OK`.
6. **Start it automatically.** In the same folder:
   ```
   powershell -ExecutionPolicy Bypass -File install-task.ps1
   ```
   The agent now starts whenever this Windows user signs in, and runs in the background.

Also set the laptop not to sleep while it is plugged in during school hours
(**Settings → System → Power → Screen and sleep**). A sleeping laptop holds scans back until it
wakes.

## ZKTime

The school can keep using ZKTime. Two things matter:

- **Never let ZKTime clear the device's records** after downloading them. The device's memory is
  what the agent reads from.
- In `live` mode the agent holds the device's connection so scans arrive within seconds, and ZKTime
  may then fail to connect. If ZKTime is still needed day to day, set `mode = poll` in `config.ini`:
  the agent connects once a minute and lets go in between, and parents hear within a minute instead.

## Day to day

- **Is it working?** In Kiddiewise, **Attendance → Settings** shows when the device was last heard
  from. While the agent runs it updates at least every five minutes.
- **What did it do?** `agent.log` in this folder lists every scan sent and any problem.
- **A number shows as "not linked".** Someone enrolled on the device has no device number in
  Kiddiewise yet. Add it under **Attendance → Device numbers**; their scans are picked up as soon as
  it's saved.
- **New key.** If the key is issued again in Kiddiewise, put the new one in `config.ini` and restart
  the computer (or the "Kiddiewise Gate Agent" task).

## Running it for development

Against a local stack (`pnpm db:seed` creates a device with the key `kwd_local_demo_device_key`):
set `url = http://localhost:3000/api/attendance-device/scans` (or your dev port) and that key, then
`python agent.py --test`.
