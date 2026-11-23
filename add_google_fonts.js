const fs = require('fs');
const file = 'C:/Users/deham/Desktop/Corehead/frontend/app/layout.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add a <link> tag in the head for Google Fonts preconnect + all our builder fonts
const oldHtmlTag = '<html lang="en" className={plusJakartaSans.variable}>';
const newHtmlTag = `<html lang="en" className={plusJakartaSans.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;600;700&family=Poppins:wght@300;400;600;700&family=Outfit:wght@300;400;600;700&family=Nunito:wght@300;400;600;700&family=Playfair+Display:wght@400;600;700&family=Merriweather:wght@300;400;700&family=Lora:wght@400;600;700&family=EB+Garamond:wght@400;600&family=JetBrains+Mono:wght@400;500&family=Fira+Code:wght@400;500&family=Space+Mono:wght@400;700&family=Bebas+Neue&family=Pacifico&family=Righteous&display=swap"
          rel="stylesheet"
        />
      </head>`;

content = content.replace(oldHtmlTag, newHtmlTag);
fs.writeFileSync(file, content, 'utf8');
console.log(content.includes('googleapis.com') ? 'Google Fonts link added!' : 'FAILED');
