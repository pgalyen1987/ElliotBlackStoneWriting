# Images Directory

## Forest Background Image

To use an actual dark forest image on the homepage, place your image file (e.g., `dark-forest.jpg` or `dark-forest.png`) in this directory and update the CSS in `css/style.css`.

### To use a real forest image:

1. Add your forest image to this directory
2. In `css/style.css`, find the `.forest-background` class
3. Replace the CSS gradient background with:

```css
.forest-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('../images/your-forest-image.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.6;
    z-index: 1;
    filter: brightness(0.4) contrast(1.3) saturate(0.8);
    animation: forest-sway 20s ease-in-out infinite;
}
```

The `filter` properties will darken and desaturate the image to maintain the eerie horror atmosphere.

### Recommended Image Specifications:
- Format: JPG or PNG
- Dimensions: At least 1920x1080px (will be cropped/zoomed as needed)
- Style: Dark, moody forest scene with trees and shadows
- Color: Dark greens, blacks, and deep shadows work best
