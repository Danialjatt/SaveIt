"""Test lossless compression with raw pixel data approach."""
import sys, os
sys.stdout.reconfigure(encoding='utf-8')

from image_compressor import lossless_compress, lossless_decompress
import numpy as np
import cv2

print("=== LOSSLESS COMPRESSION TEST ===")
print()

result = lossless_compress("sample.jpg", "test_lossless.saveit")

print()
print("=== LOSSLESS DECOMPRESSION TEST ===")
print()

restored = lossless_decompress("test_lossless.saveit", "test_lossless_restored.png")

print()
print("=== VERIFICATION ===")

# Load both images and compare pixel-by-pixel
orig = cv2.imread("sample.jpg", cv2.IMREAD_UNCHANGED)
rest = cv2.imread(restored, cv2.IMREAD_UNCHANGED)

print(f"Original shape:  {orig.shape}")
print(f"Restored shape:  {rest.shape}")

pixel_match = np.array_equal(orig, rest)
print(f"PIXEL-PERFECT:   {pixel_match}")

orig_file_kb = os.path.getsize("sample.jpg") / 1024
comp_kb = os.path.getsize("test_lossless.saveit") / 1024
rest_kb = os.path.getsize(restored) / 1024
raw_kb = (orig.shape[0] * orig.shape[1] * orig.shape[2]) / 1024

print(f"")
print(f"Raw pixels:      {raw_kb:.0f} KB")
print(f"Original file:   {orig_file_kb:.0f} KB")
print(f"Compressed:      {comp_kb:.0f} KB (.saveit)")
print(f"Restored:        {rest_kb:.0f} KB (.png)")
print(f"Reduction:       {(1-comp_kb/raw_kb)*100:.0f}% from raw pixels")

if pixel_match:
    print(f"\nSUCCESS: Every pixel is identical!")
else:
    print(f"\nFAIL: Pixels differ!")
