import os
import math
from PIL import Image, ImageDraw, ImageFont

def create_presensiku_icon(size=512, is_round=False, for_splash=False):
    # Canvas
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = size * 0.08
    box = [pad, pad, size - pad, size - pad]

    if is_round:
        # Round mask for circular icon
        draw.ellipse(box, fill=(15, 23, 42, 255))
    else:
        # Rounded rectangle with modern radius
        radius = size * 0.22
        draw.rounded_rectangle(box, radius=radius, fill=(15, 23, 42, 255))

    # Inner subtle gradient / border
    border_color = (14, 165, 233, 230) # Ocean Teal
    border_width = max(2, int(size * 0.025))
    if is_round:
        draw.ellipse(box, outline=border_color, width=border_width)
    else:
        draw.rounded_rectangle(box, radius=radius, outline=border_color, width=border_width)

    # Decorative inner accent: glowing geometric shield / checkmark
    # Monogram "PK"
    center_x = size / 2
    center_y = size / 2

    # Draw geometric monogram or shapes
    # Left bar of P
    p_x1 = size * 0.28
    p_w = size * 0.10
    p_y1 = size * 0.28
    p_y2 = size * 0.72
    draw.rounded_rectangle([p_x1, p_y1, p_x1 + p_w, p_y2], radius=size*0.03, fill=(255, 255, 255, 255))

    # Loop of P
    p_loop_r = size * 0.16
    draw.rounded_rectangle([p_x1, p_y1, p_x1 + size * 0.24, p_y1 + p_loop_r * 1.5], radius=size*0.06, fill=(14, 165, 233, 255))
    # Inner hole of P
    draw.rounded_rectangle([p_x1 + p_w*0.8, p_y1 + p_w*0.6, p_x1 + size * 0.18, p_y1 + p_loop_r * 0.9], radius=size*0.02, fill=(15, 23, 42, 255))

    # K stem & legs
    k_x = size * 0.58
    # K vertical bar
    draw.rounded_rectangle([k_x, p_y1, k_x + p_w, p_y2], radius=size*0.03, fill=(255, 255, 255, 255))

    # K top slant (Ocean Teal)
    draw.polygon([
        (k_x + p_w * 0.5, size * 0.48),
        (k_x + size * 0.20, size * 0.28),
        (k_x + size * 0.20 + p_w, size * 0.28),
        (k_x + p_w, size * 0.52),
    ], fill=(14, 165, 233, 255))

    # K bottom slant (Accent Cyan)
    draw.polygon([
        (k_x + p_w * 0.6, size * 0.46),
        (k_x + p_w, size * 0.42),
        (k_x + size * 0.22 + p_w * 0.6, size * 0.72),
        (k_x + size * 0.14, size * 0.72),
    ], fill=(56, 189, 248, 255))

    # Verified Dot / Shield beacon on top right
    dot_r = size * 0.05
    dot_x = size * 0.76
    dot_y = size * 0.22
    draw.ellipse([dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r], fill=(16, 185, 129, 255)) # Emerald Green status

    return img

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    res_dir = os.path.join(base_dir, 'android', 'app', 'src', 'main', 'res')
    os.makedirs(res_dir, exist_ok=True)

    sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192,
    }

    for folder, dim in sizes.items():
        target_folder = os.path.join(res_dir, folder)
        os.makedirs(target_folder, exist_ok=True)
        # Standard icon
        icon = create_presensiku_icon(dim, is_round=False)
        icon.save(os.path.join(target_folder, 'ic_launcher.png'), 'PNG')
        # Round icon
        round_icon = create_presensiku_icon(dim, is_round=True)
        round_icon.save(os.path.join(target_folder, 'ic_launcher_round.png'), 'PNG')

    # Drawables for splash screen
    drawable_dir = os.path.join(res_dir, 'drawable')
    drawable_v21_dir = os.path.join(res_dir, 'drawable-v21')
    os.makedirs(drawable_dir, exist_ok=True)
    os.makedirs(drawable_v21_dir, exist_ok=True)

    # Launch image
    launch_img = create_presensiku_icon(256, is_round=False, for_splash=True)
    launch_img.save(os.path.join(drawable_dir, 'launch_image.png'), 'PNG')
    launch_img.save(os.path.join(drawable_v21_dir, 'launch_image.png'), 'PNG')

    # 1. colors.xml
    values_dir = os.path.join(res_dir, 'values')
    os.makedirs(values_dir, exist_ok=True)
    with open(os.path.join(values_dir, 'colors.xml'), 'w', encoding='utf-8') as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_background">#0F172A</color>
</resources>
''')

    # 2. launch_background.xml
    launch_bg_xml = '''<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background" />
    <item>
        <bitmap
            android:gravity="center"
            android:src="@drawable/launch_image" />
    </item>
</layer-list>
'''
    with open(os.path.join(drawable_dir, 'launch_background.xml'), 'w', encoding='utf-8') as f:
        f.write(launch_bg_xml)
    with open(os.path.join(drawable_v21_dir, 'launch_background.xml'), 'w', encoding='utf-8') as f:
        f.write(launch_bg_xml)

    # 3. styles.xml for standard and v31 (Android 12+ splash)
    with open(os.path.join(values_dir, 'styles.xml'), 'w', encoding='utf-8') as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="LaunchTheme" parent="@android:style/Theme.Light.NoTitleBar">
        <item name="android:windowBackground">@drawable/launch_background</item>
    </style>
    <style name="NormalTheme" parent="@android:style/Theme.Light.NoTitleBar">
        <item name="android:windowBackground">?android:colorBackground</item>
    </style>
</resources>
''')

    values_v31_dir = os.path.join(res_dir, 'values-v31')
    os.makedirs(values_v31_dir, exist_ok=True)
    with open(os.path.join(values_v31_dir, 'styles.xml'), 'w', encoding='utf-8') as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="LaunchTheme" parent="@android:style/Theme.Light.NoTitleBar">
        <item name="android:windowSplashScreenBackground">@color/splash_background</item>
        <item name="android:windowSplashScreenAnimatedIcon">@drawable/launch_image</item>
    </style>
    <style name="NormalTheme" parent="@android:style/Theme.Light.NoTitleBar">
        <item name="android:windowBackground">?android:colorBackground</item>
    </style>
</resources>
''')

    print("Icons and splash images successfully generated!")
