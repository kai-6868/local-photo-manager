# 📸 Local Photo Profile Manager

A modern, responsive web application for managing photo profiles with local file system integration. Built with React, TypeScript, and Tailwind CSS.

## ✨ Features

- **Profile Management**: Create, edit, and organize photo profiles  
- **Local File System**: Direct folder integration using File System Access API
- **Drag & Drop**: Intuitive image reordering and upload
- **Responsive Gallery**: Adaptive column layout (2-6 columns)
- **Avatar Cropping**: Smart avatar selection with custom crop positioning
- **Lightbox Viewer**: Full-screen image viewing with navigation
- **Search & Filter**: Real-time profile search functionality
- **One-Click Profile Creation**: Auto-generated profile names (`newprofile`, `newprofile(1)`, etc.)
- **Privacy First**: All data stored locally on your device

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Modern browser (Chrome/Edge recommended for full features)

### Installation
1. Clone or download the project
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open in browser: `http://localhost:3000`

## 🎮 How to Use

### Getting Started
1. **First Launch**: App loads with sample profiles for demonstration
2. **Connect Folder**: Click "Connect Folder" to link your local photo directory (Chrome/Edge only)
3. **Browse Profiles**: View existing profiles in the responsive grid layout

### Creating Profiles
- **Quick Creation**: Click the "Add Profile" card at the end of the grid
- **Auto-naming**: New profiles get names like `newprofile`, `newprofile(1)`, etc.
- **Instant Access**: Redirected to profile detail page for customization

### Managing Photos
- **Add Photos**: Drag & drop files or use upload button
- **Reorder**: Drag images to rearrange them
- **Set Avatar**: Click avatar button on any image
- **Delete**: Use trash icon to remove images

## 🌐 Browser Compatibility

| Browser | File System Access | Features |
|---------|-------------------|----------|
| Chrome 86+ | ✅ Full Support | All features |
| Edge 86+ | ✅ Full Support | All features |
| Firefox/Safari | ❌ Fallback Mode | UI only (no persistence) |

## 📁 Project Structure

```
local-photo-manager/
├── components/              # React UI components
│   ├── HomePage.tsx        # Main profile grid view
│   ├── ProfileDetailPage.tsx # Profile management & photo gallery
│   ├── AddProfileCard.tsx  # Quick profile creation card
│   ├── ProfileCard.tsx     # Profile display card
│   ├── GalleryView.tsx     # All photos gallery view
│   ├── Lightbox.tsx        # Full-screen image viewer
│   ├── ImageWithFallback.tsx # Optimized image component
│   ├── DraggableAvatar.tsx # Drag & drop avatar component
│   ├── AddProfilePage.tsx  # Manual profile creation form
│   └── icons.tsx           # SVG icon components
├── services/               # Business logic & file operations
│   ├── FolderService.ts    # Folder & file system operations
│   ├── ProfileService.ts   # Profile management logic
│   ├── ImageService.ts     # Image processing utilities
│   ├── FileSystemService.ts # File system access wrapper
│   └── index.ts           # Service exports
├── types/                  # TypeScript type definitions
│   └── file-system-access.d.ts
├── styles/                 # CSS styles
│   └── masonry.css        # Grid layout styles
├── App.tsx                # Main application component
├── types.ts               # Core type definitions
├── index.tsx              # Application entry point
├── index.html             # HTML template
├── package.json           # Dependencies & scripts
├── vite.config.ts         # Build configuration
└── tsconfig.json          # TypeScript configuration
```

## 🛠️ Development

### Tech Stack
- **Frontend**: React 19.2, TypeScript
- **Styling**: Tailwind CSS, Custom CSS Grid
- **Build Tool**: Vite
- **File System**: File System Access API
- **Image Processing**: Canvas API for cropping

### Build Commands
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build

## 🔧 Configuration

Create `.env.local` for custom settings:
```env
VITE_PORT=3000
VITE_MAX_FILE_SIZE=10485760  # 10MB
```

## 🐛 Troubleshooting

**"Connect Folder" not working**: Use Chrome or Edge browser  
**Images not loading**: Check file formats (JPG, PNG, WebP, GIF supported)  
**Performance issues**: Limit images per profile to <100

## 📝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`  
5. Submit pull request

### Code Standards
- TypeScript strict mode
- React functional components with hooks
- Tailwind CSS for styling
- Clean, documented code

## 🔒 Privacy & Security

- **Local First**: All data stays on your device
- **No Tracking**: No analytics or external requests  
- **Secure APIs**: Uses only secure browser APIs
- **No Server**: Pure client-side application

## 📄 License

This project is for personal/educational use. Feel free to adapt for your own needs.

---

**Made with ❤️ for photo enthusiasts who value privacy and local control**
