# FLAC Upload Component

A modern web component for uploading and managing FLAC audio files with built-in analysis and tagging capabilities.

## Quick Start

1. Open `flac-upload.html` in a web browser
2. Drag and drop FLAC files or click "Browse Files" to upload
3. Use the tagging system to categorize your files
4. Listen to audio previews with the built-in controls

## Files Structure

- `flac-upload.html` - Main HTML file with the component structure
- `flac-upload.css` - All styling for the component
- `flac-upload.js` - JavaScript functionality and logic
- `FLAC-Upload-Component.md` - Complete documentation

## Features

✅ **Multiple File Upload**: Upload multiple FLAC files at once  
✅ **Drag & Drop**: Intuitive drag and drop interface  
✅ **Audio Analysis**: Automatic duration detection  
✅ **Waveform Generation**: Visual waveform display for each track  
✅ **Cover Art Upload**: Square image upload with validation  
✅ **Genre Tagging**: Dropdown selection for music genres  
✅ **Instrument Tagging**: Pre-defined and custom instrument tags  
✅ **Full Track Indicator**: Mark complete tracks vs. samples  
✅ **Audio Preview**: Built-in playback controls  
✅ **Responsive Design**: Works on desktop and mobile  
✅ **File Validation**: Ensures only FLAC files are accepted  

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Usage

Simply open the HTML file in a modern web browser. The component will automatically initialize and be ready to use.

### JavaScript API

```javascript
// Access the component instance
const uploader = window.flacUpload;

// Get all uploaded files
const files = uploader.getFiles();

// Export tag data
const tagData = uploader.exportTagData();
console.log(tagData);
```

## Next Steps

- For enhanced metadata extraction, consider integrating the [music-metadata](https://github.com/borewit/music-metadata) library
- Add server-side integration for file storage
- Implement batch operations for multiple files

---

See `FLAC-Upload-Component.md` for complete documentation and customization options.
