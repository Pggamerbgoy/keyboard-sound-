import wave
import struct
import math
import os

def generate_click(filename, freq=1000, duration=0.05, volume=0.5):
    sample_rate = 44100.0
    n_samples = int(sample_rate * duration)
    
    with wave.open(filename, 'w') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(int(sample_rate))
        
        for i in range(n_samples):
            # Envelope (fast attack, fast decay)
            envelope = math.exp(-i / (n_samples / 5.0))
            
            # Sine wave + Noise
            value = math.sin(2.0 * math.pi * freq * (i / sample_rate)) * volume * envelope
            # Add some white noise for "click"
            import random
            value += (random.random() - 0.5) * 0.2 * envelope
            
            packed_value = struct.pack('<h', int(value * 32767))
            wav.writeframesraw(packed_value)

os.makedirs('presets/mechanical', exist_ok=True)
generate_click('presets/mechanical/blue.wav', freq=2500, duration=0.04) # High click
generate_click('presets/mechanical/brown.wav', freq=800, duration=0.06) # Tactile thud
generate_click('presets/mechanical/red.wav', freq=1200, duration=0.05)   # Linear pop
