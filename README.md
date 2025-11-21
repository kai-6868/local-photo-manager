# 📸 Local Photo Profile Manager

A modern, responsive web application for managing photo profiles with local file system integration. Built with React, TypeScript, and Tailwind CSS using clean architecture principles.

## ✨ Features

- **Profile Management**: Create, edit, and organize photo profiles with ease
- **Local File System Integration**: Direct folder access using File System Access API
- **Drag & Drop Interface**: Intuitive image reordering and upload functionality
- **Responsive Photo Gallery**: Adaptive grid layout (2-6 columns based on screen size)
- **Advanced Avatar Editing**: Smart cropping with custom positioning and real-time preview
- **Full-Screen Lightbox**: Immersive image viewing with keyboard navigation
- **Real-Time Search**: Instant profile filtering and search functionality
- **Quick Profile Creation**: One-click profile generation with auto-naming
- **Privacy-First Design**: All data stored locally on your device - no server required
- **Cross-Browser Support**: Works in modern browsers with graceful fallbacks

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Modern browser (Chrome/Edge recommended for full file system features)

### Installation & Setup
```bash
# Clone or download the project
git clone [repository-url]
cd local-photo-manager

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

## 🎮 How to Use

### Getting Started
1. **Launch Application**: App starts with demo profiles to showcase functionality
2. **Connect Local Folder**: Click "Connect Folder" to link your photo directory (Chrome/Edge)
3. **Browse Profiles**: Navigate through the responsive profile grid

### Profile Management
- **Quick Creation**: Click the "Add Profile" card for instant profile generation
- **Custom Profiles**: Use the detailed creation form for full customization
- **Auto-Naming**: New profiles automatically get unique names (`newprofile`, `newprofile(1)`, etc.)
- **Edit & Delete**: Full CRUD operations with confirmation dialogs

### Photo Operations
- **Upload**: Drag & drop files or use the upload button
- **Reorder**: Drag images to rearrange gallery order
- **Avatar Selection**: Click any image to set as profile avatar
- **Advanced Cropping**: Drag avatar to adjust crop position
- **Batch Operations**: Select and manage multiple images
- **Lightbox Viewing**: Click images for full-screen experience

## 🌐 Browser Compatibility

| Browser | File System Access | All Features | Notes |
|---------|-------------------|--------------|-------|
| Chrome 86+ | ✅ Full Support | ✅ Complete | Recommended |
| Edge 86+ | ✅ Full Support | ✅ Complete | Recommended |
| Firefox | ❌ Limited | ⚠️ UI Only | No persistence |
| Safari | ❌ Limited | ⚠️ UI Only | No persistence |

## 📁 Project Architecture

The application follows clean architecture principles with clear separation of concerns:

```
local-photo-manager/
├── 📱 App.tsx                 # Main application component
├── 📄 types.ts               # Core TypeScript definitions
├── 🎯 index.tsx              # Application entry point
│
├── 🧩 components/            # React UI Components
│   ├── 🏠 HomePage.tsx       # Main profile grid view
│   ├── 📋 ProfileDetailPage.tsx # Profile management interface
│   ├── ➕ AddProfilePage.tsx  # Profile creation form
│   ├── 🖼️ GalleryView.tsx     # All photos gallery
│   ├── 💡 Lightbox.tsx       # Full-screen image viewer
│   ├── 🖇️ ProfileCard.tsx     # Individual profile display
│   ├── 📦 AddProfileCard.tsx  # Quick creation card
│   ├── 🖼️ ImageWithFallback.tsx # Optimized image component
│   ├── 🎨 icons.tsx          # SVG icon library
│   └── 📂 profile/           # Profile-specific components
│       ├── 👤 AvatarEditor.tsx   # Avatar cropping interface
│       ├── 📝 ProfileHeader.tsx  # Profile info & editing
│       ├── 🖼️ PhotoGrid.tsx      # Photo grid with interactions
│       └── 📤 UploadArea.tsx     # File upload interface
│
├── 🪝 hooks/                # Custom React Hooks
│   ├── 👥 useProfiles.ts     # Profile state management
│   ├── 📁 useFolderConnection.ts # File system integration
│   ├── ✂️ useAvatarCropping.ts  # Avatar crop functionality
│   ├── 🔄 useImageReordering.ts # Drag & drop reordering
│   └── 📥 useDragAndDrop.ts     # Generic drag & drop
│
├── ⚙️ services/             # Business Logic Layer
│   ├── 📁 FolderService.ts   # File system operations
│   ├── 📊 ProfileDataService.ts # Profile CRUD operations
│   ├── 🎭 MockDataService.ts    # Demo data generation
│   ├── 👤 ProfileService.ts     # Legacy profile logic
│   ├── 🖼️ ImageService.ts       # Image processing
│   ├── 💾 FileSystemService.ts  # File system abstraction
│   └── 📤 index.ts             # Service exports
│
├── 🛠️ utils/                # Pure Utility Functions
│   ├── 📝 profileNameUtils.ts   # Name generation & validation
│   ├── 📐 imageLayoutUtils.ts   # Layout calculations
│   ├── ✂️ cropCalculationUtils.ts # Crop mathematics
│   └── 🧹 objectUrlUtils.ts     # Memory management
│
├── 📘 types/                # Type Definitions
│   └── 📄 file-system-access.d.ts # File System API types
│
├── 🎨 styles/               # Styling
│   └── 🏗️ masonry.css        # Grid layout styles
│
└── ⚙️ Configuration Files
    ├── 📦 package.json       # Dependencies & scripts
    ├── 🔧 vite.config.ts     # Build configuration  
    ├── 📝 tsconfig.json      # TypeScript settings
    ├── 🌐 index.html         # HTML template
    └── 🔒 .env.example       # Environment variables
```

## 🛠️ Development

### Technology Stack
- **Frontend**: React 19.2 with TypeScript
- **Styling**: Tailwind CSS + Custom Grid Layouts
- **Build System**: Vite for fast development and optimized builds
- **File Operations**: File System Access API for local file management
- **Image Processing**: Canvas API for advanced cropping features
- **Architecture**: Custom hooks + Services + Utils pattern

### Available Scripts
```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Create production build
npm run preview      # Preview production build locally
npm run type-check   # Run TypeScript validation
npm run lint         # Run code linting
```

### Development Setup
```bash
# Create environment configuration
cp .env.example .env.local

# Edit configuration as needed
VITE_PORT=3000
VITE_MAX_FILE_SIZE=10485760  # 10MB default
VITE_DEBUG=false
```

## 🔧 Configuration Options

Create `.env.local` for custom settings:

```env
# Development server
VITE_PORT=3000

# File upload limits  
VITE_MAX_FILE_SIZE=10485760  # 10MB in bytes

# Debug mode
VITE_DEBUG=false
```

## 🐛 Troubleshooting

### Common Issues

**🔗 "Connect Folder" button not working**
- Solution: Use Chrome or Edge browser (requires File System Access API)

**🖼️ Images not displaying properly**  
- Check supported formats: JPG, PNG, WebP, GIF, SVG, TIFF, RAW
- Verify file permissions and accessibility

**⚡ Performance issues with large galleries**
- Recommended: Keep under 100 images per profile
- Consider using smaller image sizes for better performance

**💾 Data not persisting**
- Ensure you've connected a local folder in supported browsers
- Verify folder permissions for read/write access

**🖱️ Drag & drop not working**
- Check if browser supports HTML5 drag and drop
- Ensure files are being dragged from file system

## 🔒 Privacy & Security

- **🏠 Local-First**: All data remains on your device
- **🚫 No Tracking**: Zero analytics, cookies, or external requests
- **🔐 Secure APIs**: Uses only standard, secure browser APIs
- **🌐 No Server Required**: Pure client-side application
- **🛡️ Safe File Access**: Controlled file system permissions

## 📝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Submit** a Pull Request

### Code Standards
- TypeScript strict mode enabled
- React functional components with hooks
- Tailwind CSS for styling
- ESLint for code quality
- Clean, self-documenting code

## 📄 License

This project is licensed under the MIT License - feel free to use for personal or educational purposes.

---

**Built with ❤️ for photographers and privacy-conscious users who want complete control over their photo collections**
