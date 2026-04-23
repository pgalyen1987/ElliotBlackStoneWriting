# Elliot Blackstone - Writer's Website

A dark horror and sci-fi themed website showcasing the works of writer Elliot Blackstone.

## Features

- **Dark Theme**: Immersive dark color scheme with purple accents perfect for horror/sci-fi content
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Smooth Animations**: Glitch effects, parallax scrolling, and fade-in animations
- **Story Showcase**: Dedicated pages for individual stories with reading progress indicator
- **Modern UI/UX**: Clean, professional design with atmospheric styling

## File Structure

```
ElliotBlackStoneWriting/
├── index.html          # Homepage with featured stories
├── stories.html        # Stories listing page
├── css/
│   └── style.css       # Main stylesheet with dark theme
├── js/
│   ├── footer.js       # Injects shared footer markup into #site-footer
│   └── main.js         # JavaScript for interactivity
└── stories/
    ├── the-last-transmission.html
    ├── shadows-in-the-code.html
    └── the-echo-chamber.html
```

## Pages

### Homepage (`index.html`)
- Hero section with animated title
- Featured stories grid
- Author quote section

### Stories (`stories.html`)
- Complete listing of all stories
- Story cards with excerpts and metadata
- Category tags

### Individual Story Pages
- Full story content with reading progress bar
- Navigation between stories
- Story metadata (category, reading time, date)

## Customization

### Adding New Stories

1. Create a new HTML file in the `stories/` directory
2. Use one of the existing story pages as a template
3. Add the story to `stories.html` with appropriate metadata
4. Update navigation links in other story pages

### Changing Colors

Edit the CSS variables in `css/style.css`:

```css
:root {
    --bg-primary: #0a0a0f;
    --accent-primary: #6a0dad;
    --accent-secondary: #8b00ff;
    /* ... */
}
```

### Modifying Content

All content is in HTML files. Simply edit the text in the appropriate HTML files to update the website content.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile devices
- Progressive enhancement for older browsers

## Technologies Used

- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript
- No external dependencies

## License

© 2024 Elliot Blackstone. All rights reserved.
