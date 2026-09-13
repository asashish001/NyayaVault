import os
from PIL import Image
import numpy as np

def make_white_transparent(img_array, tolerance=10):
    # Convert image array to floats for calculation
    floats = img_array.astype(float)
    r, g, b, a = floats[:,:,0], floats[:,:,1], floats[:,:,2], floats[:,:,3]
    
    # Calculate how close each pixel is to white (255, 255, 255)
    # distance is 0 for white, larger for darker colors
    distance = (255 - r) + (255 - g) + (255 - b)
    
    # Map distance to alpha: 
    # If distance < tolerance, alpha = 0 (completely white -> transparent)
    # If distance > tolerance * 4, alpha = 255 (opaque)
    # Smooth transition in between
    new_alpha = np.clip((distance - tolerance) * (255.0 / (tolerance * 3)), 0, 255)
    
    # Update alpha channel
    img_array[:,:,3] = new_alpha.astype(np.uint8)
    return img_array

path = r'c:\Users\hp\Documents\Projects\NyayaVault\UI Images\ChatGPT Image Sep 12, 2026, 07_02_37 AM.png'
out_dir = r'c:\Users\hp\Documents\Projects\NyayaVault\public\images'
os.makedirs(out_dir, exist_ok=True)

if os.path.exists(path):
    img = Image.open(path).convert("RGBA")
    arr = np.array(img)
    
    # 1. Building: Region A (x=0 to 750, y=600 to 941 to be safe)
    # The prompt says x=0 to ~650, y=650 to bottom (941)
    # Let's crop x=0:800, y=600:941
    building_arr = arr[600:941, 0:800].copy()
    building_arr = make_white_transparent(building_arr, tolerance=15)
    building_img = Image.fromarray(building_arr, 'RGBA')
    building_img.save(os.path.join(out_dir, 'nyayavault-government-building.png'))
    
    # 2. Orbits: Region B (x=850 to 1672, y=0 to 750)
    # Let's crop x=800:1672, y=0:800
    orbits_arr = arr[0:800, 800:1672].copy()
    orbits_arr = make_white_transparent(orbits_arr, tolerance=5)
    orbits_img = Image.fromarray(orbits_arr, 'RGBA')
    orbits_img.save(os.path.join(out_dir, 'nyayavault-blue-orbits.png'))
    
    print("Successfully extracted and processed images.")
else:
    print("Reference image not found.")
