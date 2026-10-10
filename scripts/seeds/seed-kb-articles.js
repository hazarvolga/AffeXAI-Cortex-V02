const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5434,
  database: 'affexai_dev',
  user: 'postgres',
  password: 'postgres',
});

// KB Articles - 2-3 per category
const articles = [
  // TECHNICAL SUPPORT CATEGORY
  {
    categoryName: 'Technical Support',
    title: 'How to Install the Software on Windows',
    slug: 'how-to-install-software-windows',
    summary: 'Step-by-step guide to installing our software on Windows 10 and 11',
    content: `# How to Install the Software on Windows

## System Requirements

Before installing, make sure your system meets these requirements:
- Windows 10 or Windows 11 (64-bit)
- 4GB RAM minimum (8GB recommended)
- 2GB free disk space
- Internet connection for activation

## Installation Steps

### Step 1: Download the Installer
1. Visit our downloads page
2. Click "Download for Windows"
3. Save the installer file to your computer

### Step 2: Run the Installer
1. Double-click the downloaded file
2. If Windows SmartScreen appears, click "More info" then "Run anyway"
3. Click "Yes" when User Account Control prompts

### Step 3: Follow the Installation Wizard
1. Select your language
2. Accept the license agreement
3. Choose installation location (default is recommended)
4. Click "Install"

### Step 4: Activate Your License
1. Launch the application
2. Click "Activate License"
3. Enter your license key
4. Click "Activate"

## Troubleshooting

**Installation fails with error code 0x80070005**
- Run the installer as Administrator
- Disable antivirus temporarily during installation

**License activation fails**
- Check your internet connection
- Verify the license key is correct
- Contact support if issue persists

## Next Steps

After installation:
- Complete the initial setup wizard
- Import your existing projects
- Explore the tutorials in our Training section`,
    tags: ['installation', 'windows', 'getting-started'],
    isFeatured: true,
    isPublished: true,
    status: 'published'
  },
  {
    categoryName: 'Technical Support',
    title: 'Fixing Common Performance Issues',
    slug: 'fixing-common-performance-issues',
    summary: 'Solutions for slow performance and lagging issues',
    content: `# Fixing Common Performance Issues

## Is Your Software Running Slow?

This guide will help you optimize performance and resolve common slowdowns.

## Quick Fixes

### 1. Close Unnecessary Programs
- Press Ctrl+Shift+Esc to open Task Manager
- Close programs you're not using
- Free up RAM and CPU resources

### 2. Clear Cache and Temp Files
1. Go to Settings > Advanced
2. Click "Clear Cache"
3. Restart the application

### 3. Update to Latest Version
- Check Help > Check for Updates
- Install any available updates
- Updates often include performance improvements

## Advanced Optimization

### Adjust Graphics Settings
For better performance on older hardware:
1. Go to Settings > Display
2. Reduce rendering quality to "Medium"
3. Disable shadows and effects
4. Set frame rate limit to 30 FPS

### Increase Virtual Memory
1. Open System Properties
2. Go to Advanced > Performance Settings
3. Increase page file size
4. Restart your computer

### Optimize Project Files
- Archive completed projects
- Keep active projects under 500MB
- Split large projects into smaller ones

## Hardware Recommendations

For optimal performance:
- **CPU**: Intel i5 or AMD Ryzen 5 (or better)
- **RAM**: 16GB
- **Storage**: SSD (Solid State Drive)
- **Graphics**: Dedicated GPU with 2GB+ VRAM

## Still Having Issues?

If performance problems persist:
1. Run the built-in diagnostic tool (Help > Diagnostics)
2. Check the system requirements
3. Contact our support team with diagnostic results`,
    tags: ['performance', 'troubleshooting', 'optimization'],
    isFeatured: false,
    isPublished: true,
    status: 'published'
  },
  {
    categoryName: 'Technical Support',
    title: 'Error Messages and What They Mean',
    slug: 'error-messages-explained',
    summary: 'Common error codes and how to resolve them',
    content: `# Error Messages and What They Mean

## Understanding Error Codes

This guide explains common error messages and their solutions.

## License Errors

### Error: "License Not Found" (Code: L001)
**Cause**: License key not properly activated
**Solution**:
- Restart the application
- Re-enter your license key
- Check internet connection

### Error: "License Expired" (Code: L002)
**Cause**: Your license subscription has ended
**Solution**:
- Renew your license
- Contact billing for renewal options

## File Errors

### Error: "Cannot Open File" (Code: F001)
**Cause**: File is corrupted or incompatible
**Solution**:
- Try opening a backup copy
- Update to latest version
- Use File > Repair to fix corruption

### Error: "Insufficient Permissions" (Code: F002)
**Cause**: No write access to file location
**Solution**:
- Save file to a different location
- Run application as Administrator
- Check folder permissions

## Network Errors

### Error: "Connection Timeout" (Code: N001)
**Cause**: Cannot reach activation server
**Solution**:
- Check your internet connection
- Disable VPN temporarily
- Check firewall settings
- Add exception for our application

## System Errors

### Error: "Out of Memory" (Code: S001)
**Cause**: Insufficient RAM
**Solution**:
- Close other applications
- Increase virtual memory
- Upgrade RAM if possible

### Error: "Graphics Driver Error" (Code: S002)
**Cause**: Outdated or incompatible graphics drivers
**Solution**:
- Update graphics drivers
- Switch to software rendering mode
- Check graphics card compatibility

## Need More Help?

If you encounter an error not listed here:
1. Note the error code
2. Take a screenshot
3. Submit a support ticket with details`,
    tags: ['errors', 'troubleshooting', 'error-codes'],
    isFeatured: false,
    isPublished: true,
    status: 'published'
  },

  // BILLING & LICENSING CATEGORY
  {
    categoryName: 'Billing & Licensing',
    title: 'Understanding License Types',
    slug: 'understanding-license-types',
    summary: 'Different license options and which one is right for you',
    content: `# Understanding License Types

## Choose the Right License

We offer several license types to fit different needs.

## Individual License

**Best for**: Single users, freelancers
**Features**:
- 1 user account
- Install on 2 devices
- Personal use only
- Email support
- All core features

**Price**: $99/year or $9.99/month

## Professional License

**Best for**: Professional users, small teams
**Features**:
- 1 user account
- Install on 3 devices
- Commercial use allowed
- Priority email support
- Advanced features
- Cloud storage (10GB)

**Price**: $199/year or $19.99/month

## Team License

**Best for**: Teams of 5-20 users
**Features**:
- Up to 20 user accounts
- Unlimited device installations
- Team collaboration tools
- Priority support + phone support
- All features unlocked
- Cloud storage (100GB)
- Admin dashboard

**Price**: $499/year or $49.99/month

## Enterprise License

**Best for**: Large organizations (20+ users)
**Features**:
- Unlimited users
- Unlimited installations
- Dedicated account manager
- 24/7 phone support
- Custom integrations
- On-premise deployment option
- Unlimited cloud storage
- SLA guarantee
- Training sessions

**Price**: Contact sales for quote

## Educational License

**Best for**: Students, teachers, educational institutions
**Features**:
- Same as Professional
- 50% discount
- Must verify educational status
- Annual renewal required

**Price**: $99/year (normally $199)

## Comparison Table

| Feature | Individual | Professional | Team | Enterprise |
|---------|------------|--------------|------|------------|
| Users | 1 | 1 | 20 | Unlimited |
| Devices | 2 | 3 | Unlimited | Unlimited |
| Commercial Use | ❌ | ✅ | ✅ | ✅ |
| Cloud Storage | - | 10GB | 100GB | Unlimited |
| Support | Email | Priority Email | Phone | 24/7 |

## Upgrading Your License

You can upgrade anytime:
1. Go to Account > License
2. Click "Upgrade"
3. Pay the difference
4. New features activate immediately`,
    tags: ['licensing', 'pricing', 'plans'],
    isFeatured: true,
    isPublished: true,
    status: 'published'
  },
  {
    categoryName: 'Billing & Licensing',
    title: 'How to Transfer Your License',
    slug: 'how-to-transfer-license',
    summary: 'Steps to move your license to a new computer or user',
    content: `# How to Transfer Your License

## Moving to a New Computer

Follow these steps to transfer your license safely.

## Method 1: Deactivate and Reactivate

### Step 1: Deactivate on Old Computer
1. Open the application
2. Go to Help > License Information
3. Click "Deactivate License"
4. Confirm deactivation
5. Close the application

### Step 2: Activate on New Computer
1. Install the software on new computer
2. Launch the application
3. Enter your license key
4. Click "Activate"

## Method 2: Transfer via Account Portal

If you can't access the old computer:

1. Log in to your account at our website
2. Go to My Licenses
3. Find your active license
4. Click "Deactivate All Devices"
5. Install and activate on new computer

## Transferring to Another User

### For Individual/Professional Licenses:
1. Contact support with transfer request
2. Provide new user's email
3. We'll process the transfer (1-2 business days)
4. New user receives activation email

**Note**: One transfer allowed per year for free, additional transfers: $25 fee

### For Team/Enterprise Licenses:
1. Admin logs into dashboard
2. Go to Users > Manage Licenses
3. Remove old user
4. Add new user
5. New user gets invitation email

## Important Notes

⚠️ **License Limits**:
- Individual: 2 devices
- Professional: 3 devices
- Team: Unlimited devices

⚠️ **Before Transferring**:
- Back up your projects
- Export custom settings
- Save your work

⚠️ **Transfer Restrictions**:
- Can't transfer educational licenses
- Must be same license type
- Transfer history is tracked

## Troubleshooting

**"Maximum devices reached"**
- Deactivate an old device first
- Contact support to reset device count

**"License already in use"**
- Deactivate all devices via account portal
- Wait 5 minutes, then reactivate`,
    tags: ['licensing', 'transfer', 'activation'],
    isFeatured: false,
    isPublished: true,
    status: 'published'
  },

  // TRAINING & EDUCATION CATEGORY
  {
    categoryName: 'Training & Education',
    title: 'Getting Started Guide for Beginners',
    slug: 'getting-started-guide-beginners',
    summary: 'Complete beginner\'s guide to using the software',
    content: `# Getting Started Guide for Beginners

## Welcome! 👋

This guide will help you get started with our software in just 30 minutes.

## Step 1: Understanding the Interface (5 mins)

### Main Areas

**Top Menu Bar**:
- File: Create, open, save projects
- Edit: Undo, redo, preferences
- View: Panels, layouts, zoom
- Tools: Main features
- Help: Tutorials, support

**Left Sidebar** (Toolbox):
- Quick access to tools
- Drag tools to workspace
- Right-click for options

**Center Workspace**:
- Main working area
- Where your project appears
- Drag to pan, scroll to zoom

**Right Panel** (Properties):
- Adjust settings
- See details
- Fine-tune values

**Bottom Panel** (Timeline/History):
- Project timeline
- Undo history
- Version control

## Step 2: Your First Project (10 mins)

### Create a New Project

1. Click File > New Project
2. Choose a template or start blank
3. Name your project
4. Set dimensions and units
5. Click "Create"

### Basic Operations

**Add Elements**:
- Click tool in sidebar
- Click workspace to place
- Drag to resize

**Move Elements**:
- Select with pointer tool
- Drag to move
- Use arrow keys for precision

**Edit Properties**:
- Select element
- Adjust values in right panel
- See changes in real-time

## Step 3: Essential Tools (10 mins)

### Must-Know Tools

**Selection Tool** (V):
- Select and move objects
- Resize and rotate
- Your most-used tool

**Shape Tools**:
- Rectangle (R)
- Circle (C)
- Polygon (P)

**Text Tool** (T):
- Add text
- Change fonts
- Format paragraphs

**Zoom Tool** (Z):
- Click to zoom in
- Alt+Click to zoom out
- Scroll wheel also works

## Step 4: Saving and Exporting (5 mins)

### Save Your Work

**Save Project**:
1. File > Save (Ctrl+S)
2. Choose location
3. Save regularly!

**Auto-Save**:
- Enabled by default
- Saves every 5 minutes
- Find in Edit > Preferences

### Export

**Export for Sharing**:
1. File > Export
2. Choose format (PDF, PNG, JPG)
3. Set quality/size
4. Click "Export"

## Step 5: Get Help When Needed

### Built-in Help

**Tooltips**:
- Hover over any tool
- See what it does
- Keyboard shortcuts shown

**Help Menu**:
- Keyboard shortcuts list
- Video tutorials
- User manual

**Search**:
- Press F1 for help search
- Type what you need
- Find answers instantly

### Community Resources

- YouTube tutorials
- Community forum
- Weekly webinars
- Example projects library

## Practice Project

Try this simple project:

1. Create new project (A4 size)
2. Add a rectangle
3. Change its color
4. Add text on top
5. Export as PNG

**Congratulations!** 🎉 You've completed your first project!

## Next Steps

Now that you know the basics:
1. Try the interactive tutorials (Help > Tutorials)
2. Explore example projects
3. Watch our YouTube series
4. Join the community forum

## Common Beginner Questions

**Q: Where are my files saved?**
A: Documents > [AppName] > Projects

**Q: Can I undo?**
A: Yes! Ctrl+Z (unlimited undo)

**Q: How do I reset if I mess up?**
A: File > Revert to Saved

**Q: Where's my toolbar?**
A: View > Show Toolbar (if hidden)`,
    tags: ['getting-started', 'tutorial', 'beginner'],
    isFeatured: true,
    isPublished: true,
    status: 'published'
  },
  {
    categoryName: 'Training & Education',
    title: 'Video Tutorial Library',
    slug: 'video-tutorial-library',
    summary: 'Complete collection of video tutorials for all skill levels',
    content: `# Video Tutorial Library

## Learn by Watching

Browse our complete collection of video tutorials.

## Beginner Series (10 videos)

### 1. Welcome and Installation (5:30)
- Download and install
- First launch
- License activation
- **[Watch Video] (youtube.com/watch?v=example)**

### 2. Interface Tour (8:45)
- Menu bar overview
- Toolbox introduction
- Panel layout
- Customizing workspace

### 3. Your First Project (12:20)
- Creating a new project
- Basic tools
- Saving and exporting

### 4. Working with Shapes (10:15)
- Rectangle, circle, polygon
- Transforming shapes
- Combining shapes

### 5. Text and Typography (9:30)
- Adding text
- Font selection
- Text effects

## Intermediate Series (15 videos)

### 6. Advanced Tools (15:40)
- Pen tool mastery
- Bezier curves
- Path operations

### 7. Layers and Organization (11:25)
- Layer panel
- Grouping objects
- Naming and colors

### 8. Color and Gradients (13:10)
- Color picker
- Gradient tool
- Color harmony

### 9. Effects and Filters (16:50)
- Shadow effects
- Blur and glow
- Custom effects

### 10. Templates and Presets (8:55)
- Using templates
- Creating presets
- Saving favorites

## Advanced Series (12 videos)

### 11. Automation and Scripts (18:30)
- Batch operations
- Actions recorder
- Script basics

### 12. Plugin Integration (14:20)
- Installing plugins
- Popular plugins
- Plugin development

### 13. Performance Optimization (12:00)
- Large file handling
- Cache management
- Render settings

### 14. Collaboration Features (16:40)
- Team projects
- Version control
- Comments and review

## Specialized Topics

### Web Design Workflow (25:15)
- Responsive design
- Exporting for web
- Optimization tips

### Print Production (22:30)
- CMYK workflow
- Bleed and trim
- Print-ready files

### Mobile UI Design (28:45)
- iOS guidelines
- Android guidelines
- Prototyping

## Live Webinar Recordings

### Monthly Q&A Sessions
- Tips and tricks
- User questions
- New feature demos

### Certification Preparation
- Exam overview
- Practice tests
- Study guides

## How to Use This Library

**For Beginners**:
1. Start with Beginner Series (videos 1-5)
2. Practice after each video
3. Move to Intermediate when comfortable

**For Existing Users**:
- Jump to specific topics
- Use search to find solutions
- Bookmark your favorites

**Study Tips**:
- Watch at 0.75x speed for detail
- Pause and practice along
- Repeat difficult sections
- Take notes

## Download Video Files

Premium users can download videos for offline viewing:
- Go to Account > Downloads
- Choose video quality (720p, 1080p)
- Download entire series or individual videos

## Suggest Topics

Want a tutorial on something specific?
- Visit Community > Request Tutorial
- Upvote existing requests
- We create most-requested topics monthly`,
    tags: ['tutorial', 'video', 'training', 'learning'],
    isFeatured: true,
    isPublished: true,
    status: 'published'
  },

  // GENERAL INQUIRY CATEGORY
  {
    categoryName: 'General Inquiry',
    title: 'Frequently Asked Questions (FAQ)',
    slug: 'frequently-asked-questions',
    summary: 'Quick answers to the most common questions',
    content: `# Frequently Asked Questions (FAQ)

## General Questions

### What is this software?
Our software is a professional [type] tool designed for [purpose]. It helps [target users] to [main benefits].

### Do I need an internet connection?
- **Installation**: Yes, internet required
- **Activation**: Yes, one-time internet connection needed
- **Usage**: No, works offline after activation
- **Updates**: Internet needed for updates and cloud features

### What platforms are supported?
- Windows 10, 11 (64-bit)
- macOS 11+ (Intel and Apple Silicon)
- Linux (Ubuntu 20.04+, via community port)

### Is there a mobile version?
- Currently: No native mobile app
- Coming soon: iPad app (Q2 2025)
- Web viewer available for mobile browsers

## Licensing Questions

### Can I try before buying?
Yes! We offer:
- 14-day free trial
- Full feature access
- No credit card required
- Convert to paid anytime

### What payment methods do you accept?
- Credit cards (Visa, Mastercard, Amex)
- PayPal
- Bank transfer (Enterprise only)
- Purchase orders (Enterprise only)

### Do you offer refunds?
Yes, 30-day money-back guarantee:
- Full refund if not satisfied
- No questions asked
- Request via support ticket

### Can I upgrade my license later?
Absolutely!
- Upgrade anytime
- Pay only the difference
- Prorated for annual subscriptions

## Technical Questions

### What are the minimum system requirements?
- OS: Windows 10+ or macOS 11+
- RAM: 4GB minimum (8GB recommended)
- Storage: 2GB free space
- Display: 1280x720 minimum

### Where are my files stored?
Default locations:
- Windows: C:\\\\Users\\\\[username]\\\\Documents\\\\[AppName]
- macOS: ~/Documents/[AppName]
- Custom: Set in Preferences > File Locations

### How do I update the software?
Updates are automatic by default:
- Help > Check for Updates
- Or wait for auto-update notification
- Manual download available on website

### Can I use this offline?
Yes, most features work offline:
- ✅ Core editing tools
- ✅ Local project management
- ❌ Cloud sync requires internet
- ❌ AI features require internet

## Account Questions

### I forgot my password
1. Click "Forgot Password" on login page
2. Enter your email
3. Check inbox for reset link
4. Create new password

### How do I change my email?
1. Log in to account portal
2. Go to Settings > Account
3. Update email address
4. Verify new email

### Can I have multiple accounts?
- Personal use: No, one account per license
- Business use: Yes, with Team/Enterprise license

## Support Questions

### How do I contact support?
Multiple ways:
- Email: support@[company].com
- Live chat: Mon-Fri 9AM-6PM EST
- Phone: Available for Pro+ users
- Support tickets: 24/7

### What's your response time?
- Individual: Within 48 hours
- Professional: Within 24 hours
- Team: Within 12 hours
- Enterprise: Within 4 hours (SLA)

### Do you offer training?
Yes, several options:
- Free video tutorials
- Live webinars (monthly)
- One-on-one training (Enterprise)
- Certification program

## Billing Questions

### When will I be charged?
- Trial: Not charged during trial
- Monthly: Charged on signup date each month
- Annual: Charged yearly on signup anniversary

### Can I cancel anytime?
Yes:
- Monthly: Cancel before renewal date
- Annual: Cancel anytime, no refund for unused time
- No cancellation fees

### Do prices include tax?
- Displayed prices: Exclude tax
- Tax added at checkout
- Varies by location (VAT, GST, etc.)

## Data and Privacy

### Is my data safe?
Yes, we take security seriously:
- Encrypted data transmission
- Secure cloud storage
- Regular security audits
- GDPR compliant

### Do you sell my data?
No, never:
- We don't sell user data
- No third-party advertising
- Read our Privacy Policy

### Can I delete my account?
Yes:
- Account > Settings > Delete Account
- All data permanently deleted
- Cannot be undone

## Still Have Questions?

If you didn't find your answer:
1. Search our Knowledge Base
2. Ask in Community Forum
3. Contact Support
4. Live Chat with our team`,
    tags: ['faq', 'questions', 'help'],
    isFeatured: true,
    isPublished: true,
    status: 'published'
  },
  {
    categoryName: 'General Inquiry',
    title: 'System Requirements and Compatibility',
    slug: 'system-requirements-compatibility',
    summary: 'Detailed system requirements and compatibility information',
    content: `# System Requirements and Compatibility

## Minimum Requirements

These are the bare minimum specs to run the software:

### Windows
- **OS**: Windows 10 (64-bit) or later
- **Processor**: Intel Core i3 or AMD equivalent
- **RAM**: 4GB
- **Graphics**: DirectX 11 compatible
- **Storage**: 2GB free space
- **Display**: 1280 x 720 resolution

### macOS
- **OS**: macOS 11 (Big Sur) or later
- **Processor**: Intel Core i3 or Apple M1
- **RAM**: 4GB
- **Graphics**: Metal-capable GPU
- **Storage**: 2GB free space
- **Display**: 1280 x 720 resolution

### Linux (Community Supported)
- **OS**: Ubuntu 20.04 LTS or later
- **Processor**: Intel Core i3 or AMD equivalent
- **RAM**: 4GB
- **Graphics**: OpenGL 3.3 compatible
- **Storage**: 2GB free space

## Recommended Requirements

For optimal performance:

### Windows
- **OS**: Windows 11 (64-bit)
- **Processor**: Intel Core i5 (8th gen) or AMD Ryzen 5
- **RAM**: 16GB
- **Graphics**: NVIDIA GTX 1050 / AMD RX 560 or better
- **Storage**: SSD with 10GB free space
- **Display**: 1920 x 1080 or higher

### macOS
- **OS**: macOS 13 (Ventura) or later
- **Processor**: Apple M1 Pro or Intel Core i7
- **RAM**: 16GB
- **Graphics**: Apple M1 integrated or dedicated GPU
- **Storage**: SSD with 10GB free space
- **Display**: Retina display

## Professional/Enterprise Requirements

For demanding workflows:

- **Processor**: Intel i7/i9 or AMD Ryzen 7/9
- **RAM**: 32GB or more
- **Graphics**: NVIDIA RTX 3060 / AMD RX 6700 XT or better
- **Storage**: NVMe SSD with 50GB+ free space
- **Display**: 4K display (3840 x 2160)

## Compatibility

### File Format Support

**Import**:
- Images: PNG, JPG, GIF, TIFF, WebP, SVG
- Documents: PDF, AI, EPS, PSD
- Video: MP4, MOV, AVI (preview only)
- 3D: OBJ, FBX, STL (with plugin)

**Export**:
- Raster: PNG, JPG, TIFF, WebP
- Vector: SVG, PDF, EPS
- Web: HTML, CSS (with plugin)

### Integration

**Cloud Services**:
- Dropbox
- Google Drive
- OneDrive
- iCloud Drive

**Design Tools**:
- Adobe Creative Cloud (import/export)
- Sketch (import)
- Figma (via plugin)

**Productivity**:
- Microsoft Office
- Google Workspace
- Slack notifications
- Trello integration

## Browser Requirements

For web-based features:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Network Requirements

### Bandwidth
- Minimum: 1 Mbps download
- Recommended: 5+ Mbps for cloud features
- Required ports: 443 (HTTPS), 80 (HTTP)

### Firewall
Allow connections to:
- license.ourcompany.com
- api.ourcompany.com
- cdn.ourcompany.com

## Hardware Recommendations by Use Case

### Graphic Design
- i5/Ryzen 5
- 16GB RAM
- Color-calibrated monitor
- Pen tablet (optional)

### Video Editing
- i7/Ryzen 7
- 32GB RAM
- Dedicated GPU (4GB+ VRAM)
- Fast SSD storage

### 3D Work
- i7/Ryzen 7 or better
- 32GB+ RAM
- High-end GPU (RTX 3070+)
- Dual monitors recommended

### Photography
- i5/Ryzen 5
- 16GB RAM
- Color-accurate display
- Pen tablet helpful

## Virtualization

**Supported**:
- VMware Workstation/Fusion
- Parallels Desktop
- VirtualBox

**Requirements**:
- 3D acceleration enabled
- 8GB+ allocated RAM
- SSD storage

**Not Recommended**:
- Remote desktop (lag issues)
- Cloud VMs (latency)

## Mobile/Tablet

**Current Status**:
- No native mobile app
- Web viewer works on tablets
- Limited functionality

**Coming Soon**:
- iPad app (Q2 2025)
- Full feature set
- Apple Pencil support

## Checking Your System

### Windows
1. Right-click Start > System
2. View specs
3. Compare with requirements

### macOS
1. Apple menu >  About This Mac
2. View Overview
3. Check against requirements

### Automated Check
Visit our website and run the System Check tool - it will automatically detect if your system is compatible.`,
    tags: ['requirements', 'compatibility', 'system', 'specs'],
    isFeatured: false,
    isPublished: true,
    status: 'published'
  },

  // FEATURE REQUEST CATEGORY
  {
    categoryName: 'Feature Request',
    title: 'How to Submit Feature Requests',
    slug: 'how-to-submit-feature-requests',
    summary: 'Guidelines for suggesting new features and improvements',
    content: `# How to Submit Feature Requests

## We Love Your Ideas! 💡

Your feedback shapes our product roadmap. Here's how to submit effective feature requests.

## Before Submitting

### 1. Search Existing Requests
- Visit Community > Feature Requests
- Search for similar ideas
- Upvote existing requests instead of duplicating

### 2. Check the Roadmap
- See what's already planned
- Roadmap updated quarterly
- Planned features listed by release

### 3. Consider the Scope
- Is this a minor tweak or major feature?
- Would it benefit most users or just you?
- Is there a workaround currently?

## How to Submit

### Step 1: Choose Platform

**Community Forum** (Recommended):
- Public discussion
- Other users can upvote
- Team can ask clarifying questions

**Support Ticket**:
- Private submission
- Direct team contact
- Faster response for Enterprise customers

**Email**:
- features@ourcompany.com
- Less visibility
- Slower response

### Step 2: Write a Good Request

#### Use This Template:

**Title**: Clear, descriptive (e.g., "Add Dark Mode Support")

**Description**:

## Problem/Need
What problem does this solve?
What can't you do currently?

## Proposed Solution
How should this feature work?
What should it look like?

## Use Case
How would you use this?
Real-world example scenario

## Benefits
Who else would benefit?
Why is this important?

## Alternatives Considered
What workarounds exist?
Why aren't they sufficient?

### Step 3: Add Details

**Helpful Additions**:
- Screenshots or mockups
- Examples from other software
- Workflow diagrams
- Video demonstration

**Be Specific**:
- ❌ "Make it faster"
- ✅ "Reduce export time for 4K video by optimizing encoding"

## What Happens Next?

### Review Process

1. **Initial Review** (1-2 weeks)
   - Team reviews submission
   - Categorized and tagged
   - Added to feature request board

2. **Community Voting** (Ongoing)
   - Public requests get upvotes
   - Most popular rise to top
   - Comments add discussion

3. **Evaluation** (Quarterly)
   - Top requests evaluated
   - Feasibility assessed
   - Priority determined

4. **Roadmap Decision** (Quarterly)
   - Selected features added to roadmap
   - Release version assigned
   - Status updated to "Planned"

### Status Tracking

**Under Review**: Team is evaluating
**Planned**: Added to roadmap
**In Progress**: Actively being developed
**Completed**: Feature released
**Won't Fix**: Not feasible or out of scope

## Tips for Success

### Increase Your Chances

**Do**:
✅ Be clear and specific
✅ Explain the "why" not just "what"
✅ Provide use cases
✅ Include visuals if possible
✅ Engage with comments
✅ Upvote similar requests

**Don't**:
❌ Duplicate existing requests
❌ Demand immediate implementation
❌ Submit vague ideas
❌ Request platform changes we can't control
❌ Suggest against our product vision

### High-Priority Criteria

Features more likely to be implemented:
- Benefit many users (not just one)
- Align with product vision
- Technically feasible
- High community upvotes
- Clear business value
- Requested by Enterprise customers

## Feature Request Examples

### Good Example ✅

**Title**: Add Batch Export with Custom Naming

**Description**:
*Problem*: Currently must export files one-by-one, manually naming each. Time-consuming for 100+ files.

*Proposed Solution*: Batch export dialog with:
- Select multiple files
- Custom naming pattern (e.g., project_[number]_[date])
- Choose export format and quality
- Queue system showing progress

*Use Case*: I manage social media for clients and export 50-100 graphics daily. This would save ~2 hours per day.

*Benefits*: Anyone exporting multiple files would benefit - photographers, designers, content creators.

### Bad Example ❌

**Title**: Make it better

**Description**: The software should be better and faster. Add more features.

*(Too vague, no specific problem, no use case, no actionable information)*

## Voting and Discussion

### Upvoting
- Click ⬆️ on feature requests
- One vote per user
- Shows community support
- Influences priority

### Commenting
- Add your use case
- Suggest refinements
- Share workarounds
- Keep discussion constructive

## Enterprise Fast Track

Enterprise customers can:
- Request private features
- Get dedicated roadmap items
- Sponsor feature development
- Faster implementation timeline

Contact your account manager for details.

## Check Status

Track your requests:
1. Log in to Community
2. Go to "My Activity"
3. See all your requests
4. Status updates emailed automatically

## Feature Request Hall of Fame

Recent community requests that became features:
- Dark Mode (v3.2) - 1,245 upvotes
- Cloud Collaboration (v3.5) - 892 upvotes
- Plugin API (v4.0) - 756 upvotes
- Template Library (v4.1) - 651 upvotes

**Your idea could be next!** 🎉`,
    tags: ['feature-request', 'feedback', 'suggestions'],
    isFeatured: true,
    isPublished: true,
    status: 'published'
  }
];

async function seedKBArticles() {
  try {
    console.log('🌱 Starting Knowledge Base articles seed...\n');

    await client.connect();
    console.log('✅ Connected to database\n');

    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Get admin user ID
    const adminResult = await client.query(`
      SELECT id FROM users WHERE email = 'admin@affexai.com' LIMIT 1
    `);

    if (adminResult.rows.length === 0) {
      throw new Error('Admin user not found');
    }

    const adminId = adminResult.rows[0].id;
    console.log(`📌 Using admin user: ${adminId}\n`);

    // Get category IDs
    const categoriesResult = await client.query('SELECT id, name FROM ticket_categories');
    const categoryMap = {};
    categoriesResult.rows.forEach(row => {
      categoryMap[row.name] = row.id;
    });

    console.log('📚 Seeding KB articles...\n');

    for (const article of articles) {
      const categoryId = categoryMap[article.categoryName];
      const escapedTitle = article.title.replace(/'/g, "''");
      const escapedSummary = article.summary.replace(/'/g, "''");
      const escapedContent = article.content.replace(/'/g, "''");

      await client.query(`
        INSERT INTO knowledge_base_articles (
          id, title, content, summary, slug, "categoryId", "authorId",
          tags, "isPublished", "isFeatured", "viewCount", "helpfulCount",
          "notHelpfulCount", "searchScore", "relatedArticleIds", metadata,
          status, "publishedAt", "createdAt", "updatedAt"
        ) VALUES (
          uuid_generate_v4(),
          '${escapedTitle}',
          '${escapedContent}',
          '${escapedSummary}',
          '${article.slug}',
          '${categoryId}',
          '${adminId}',
          '${article.tags.join(',')}',
          ${article.isPublished},
          ${article.isFeatured},
          0,
          0,
          0,
          0,
          '',
          '{}',
          '${article.status}',
          ${article.isPublished ? 'NOW()' : 'NULL'},
          NOW(),
          NOW()
        )
      `);

      console.log(`✅ Created: ${article.title} (${article.categoryName})`);
    }

    console.log('\n🎉 KB articles seeded successfully!\n');

    // Verification
    const result = await client.query(`
      SELECT
        kba.id, kba.title, tc.name as category, kba."isFeatured", kba."isPublished"
      FROM knowledge_base_articles kba
      LEFT JOIN ticket_categories tc ON kba."categoryId" = tc.id
      ORDER BY tc.name, kba.title
    `);

    console.log('📊 Articles in database:');
    console.table(result.rows);

    // Count by category
    const countResult = await client.query(`
      SELECT tc.name as category, COUNT(kba.id) as article_count
      FROM ticket_categories tc
      LEFT JOIN knowledge_base_articles kba ON tc.id = kba."categoryId"
      GROUP BY tc.name
      ORDER BY tc.name
    `);

    console.log('\n📊 Articles per category:');
    console.table(countResult.rows);

    await client.end();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding KB articles:', error);
    process.exit(1);
  }
}

seedKBArticles();
