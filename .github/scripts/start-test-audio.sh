#!/usr/bin/env bash
set -euo pipefail

# Headless Linux runners need an output device for Firefox's real WebAudio context.
if ! command -v pulseaudio >/dev/null; then
  sudo apt-get update
  sudo apt-get install --yes pulseaudio
fi
pulseaudio --start --exit-idle-time=-1
pactl load-module module-null-sink sink_name=haptic_ci sink_properties=device.description=HapticCI
pactl set-default-sink haptic_ci
pactl list short sinks
