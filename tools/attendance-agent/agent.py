"""
Kiddiewise gate agent.

Runs on the school computer that is cabled to the ZKTeco fingerprint device. It reads every scan off
the device and posts it to Kiddiewise, which marks the register and tells the child's guardians.

The device is the queue. Scans stay on it until they are read, and the agent only moves its
"sent up to" mark forward after Kiddiewise has accepted a batch. So a laptop switched off overnight,
a dropped Wi-Fi connection or a server error loses nothing: on the next connection the agent reads
from the mark again and re-sends, and Kiddiewise ignores anything it already has.

    python agent.py            run until stopped
    python agent.py --test     check the device and the server, then exit
"""

from __future__ import annotations

import argparse
import configparser
import json
import logging
import logging.handlers
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import requests
from zk import ZK

HERE = Path(sys.executable if getattr(sys, "frozen", False) else __file__).resolve().parent
BATCH = 500  # must not exceed MAX_SCANS_PER_REQUEST in lib/validators/gate.ts
HEARTBEAT_SECONDS = 300
log = logging.getLogger("gate-agent")


@dataclass
class Config:
    device_ip: str
    device_port: int
    comm_key: int
    server_url: str
    device_key: str
    mode: str  # "live" or "poll"
    poll_seconds: int


def load_config(path: Path) -> Config:
    parser = configparser.ConfigParser()
    if not parser.read(path):
        raise SystemExit(f"Config file not found: {path}. Copy config.example.ini to config.ini first.")
    device, server, agent = parser["device"], parser["server"], parser["agent"]
    mode = agent.get("mode", "live").strip().lower()
    if mode not in ("live", "poll"):
        raise SystemExit("[agent] mode must be live or poll")
    return Config(
        device_ip=device.get("ip", "192.168.0.201").strip(),
        device_port=device.getint("port", 4370),
        comm_key=device.getint("comm_key", 0),
        server_url=server["url"].strip(),
        device_key=server["key"].strip(),
        mode=mode,
        poll_seconds=agent.getint("poll_seconds", 60),
    )


class State:
    """The device time of the last scan Kiddiewise accepted, kept in state.json beside the agent."""

    def __init__(self, path: Path):
        self.path = path
        self.last_sent: str | None = None
        if path.exists():
            self.last_sent = json.loads(path.read_text()).get("last_sent")

    def advance(self, device_time: str) -> None:
        if self.last_sent is not None and device_time <= self.last_sent:
            return
        self.last_sent = device_time
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps({"last_sent": device_time}))
        tmp.replace(self.path)  # atomic, so a power cut never leaves half a file


def device_time(ts: datetime) -> str:
    """The device's own wall-clock time. Kiddiewise reads it in the school's timezone."""
    return ts.strftime("%Y-%m-%d %H:%M:%S")


def post(cfg: Config, scans: list[dict]) -> None:
    response = requests.post(
        cfg.server_url,
        json={"scans": scans},
        headers={"Authorization": f"Bearer {cfg.device_key}"},
        timeout=30,
    )
    if response.status_code == 401:
        raise RuntimeError("Kiddiewise rejected the device key. Issue a new key in Attendance > Settings.")
    response.raise_for_status()
    unknown = response.json().get("unknown_user_ids") or []
    if unknown:
        log.warning("Numbers not linked to anyone in Kiddiewise yet: %s", ", ".join(unknown))


def as_scan(record) -> dict:
    return {"user_id": str(record.user_id).strip(), "time": device_time(record.timestamp)}


def catch_up(conn, cfg: Config, state: State) -> int:
    """Send everything on the device from the last accepted scan onwards. Returns how many were sent."""
    records = conn.get_attendance() or []
    # ">=": a scan sharing the mark's second may not have been in the accepted batch. Re-sending the
    # ones that were is harmless; the server keeps each scan once.
    pending = sorted(
        (r for r in records if state.last_sent is None or device_time(r.timestamp) >= state.last_sent),
        key=lambda r: r.timestamp,
    )
    for start in range(0, len(pending), BATCH):
        batch = pending[start : start + BATCH]
        post(cfg, [as_scan(r) for r in batch])
        state.advance(device_time(batch[-1].timestamp))
    if pending:
        log.info("Sent %d scan(s) from the device's memory.", len(pending))
    return len(pending)


def listen(conn, cfg: Config, state: State) -> None:
    """Forward each scan as it happens. Any failure ends the session; the caller reconnects and catches up."""
    last_contact = time.monotonic()
    for record in conn.live_capture():
        if record is None:
            # live_capture yields None every ~10s with nothing new. Every few minutes, tell
            # Kiddiewise the device is still connected, so the admin's "last heard from" stays true.
            if time.monotonic() - last_contact >= HEARTBEAT_SECONDS:
                post(cfg, [])
                last_contact = time.monotonic()
            continue
        scan = as_scan(record)
        post(cfg, [scan])
        state.advance(scan["time"])
        last_contact = time.monotonic()
        log.info("Scan from No. %s at %s", scan["user_id"], scan["time"])


def connect(cfg: Config):
    zk = ZK(cfg.device_ip, port=cfg.device_port, timeout=10, password=cfg.comm_key, force_udp=False, ommit_ping=True)
    return zk.connect()


def run(cfg: Config, state: State) -> None:
    delay = 5
    while True:
        conn = None
        try:
            conn = connect(cfg)
            log.info("Connected to the device at %s.", cfg.device_ip)
            catch_up(conn, cfg, state)
            post(cfg, [])  # marks the device as heard from, even when there was nothing to send
            delay = 5
            if cfg.mode == "live":
                listen(conn, cfg, state)
            else:
                conn.disconnect()
                conn = None
                time.sleep(cfg.poll_seconds)
                continue
        except Exception as error:  # noqa: BLE001 - the agent must outlive any single failure
            log.warning("%s. Trying again in %ds.", error, delay)
            time.sleep(delay)
            delay = min(delay * 2, 60)
        finally:
            if conn is not None:
                try:
                    conn.disconnect()
                except Exception:  # noqa: BLE001
                    pass


def self_test(cfg: Config) -> int:
    ok = True
    print(f"Device {cfg.device_ip}:{cfg.device_port} ... ", end="", flush=True)
    try:
        conn = connect(cfg)
        users = conn.get_users() or []
        records = conn.get_attendance() or []
        print(f"OK. Serial {conn.get_serialnumber()}, clock {conn.get_time()}, {len(users)} users, {len(records)} scans stored.")
        conn.disconnect()
    except Exception as error:  # noqa: BLE001
        ok = False
        print(f"FAILED: {error}")
        print("  Check the cable, that ZKTime is not connected right now, and the IP and comm key in config.ini.")

    print(f"Kiddiewise {cfg.server_url} ... ", end="", flush=True)
    try:
        post(cfg, [])
        print("OK. The device key was accepted.")
    except Exception as error:  # noqa: BLE001
        ok = False
        print(f"FAILED: {error}")
    return 0 if ok else 1


def main() -> int:
    args = argparse.ArgumentParser(description="Kiddiewise gate agent")
    args.add_argument("--config", type=Path, default=HERE / "config.ini")
    args.add_argument("--test", action="store_true", help="check the device and the server, then exit")
    opts = args.parse_args()

    handlers: list[logging.Handler] = [
        logging.handlers.RotatingFileHandler(HERE / "agent.log", maxBytes=1_000_000, backupCount=3),
    ]
    if sys.stdout is not None:  # pythonw / a windowed exe has no console
        handlers.append(logging.StreamHandler())
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s", handlers=handlers)

    cfg = load_config(opts.config)
    if opts.test:
        return self_test(cfg)
    log.info("Gate agent starting (%s mode).", cfg.mode)
    run(cfg, State(HERE / "state.json"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
