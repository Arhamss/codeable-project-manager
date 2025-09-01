# Profile Picture Upload Setup

## Overview
This application now supports profile picture uploads for both users and admins using Firebase Storage.

## Features
- **Profile Picture Upload**: Users can upload profile pictures from the Profile page
- **Automatic Fallback**: Shows user initials when no profile picture is set
- **Firebase Storage Integration**: All images are stored securely in Firebase Storage
- **Multiple Sizes**: Supports different sizes (small, medium, large, xlarge)
- **Image Validation**: Only accepts image files under 5MB
- **Preview & Upload**: Shows image preview before uploading

## How to Use

### For Users
1. Navigate to **Profile** page (`/profile`)
2. Click on your profile picture (or initials circle)
3. Select an image file (JPG, PNG, GIF, etc.)
4. Preview the image and click the green upload button
5. Your profile picture will be updated immediately

### For Admins
- Same functionality as regular users
- Profile pictures appear in the sidebar and top navigation
- Can update profile pictures from the Profile page

## Technical Details

### File Storage
- **Location**: Firebase Storage under `profile-pictures/` folder
- **Naming**: `{userId}-{timestamp}.{extension}`
- **Size Limit**: 5MB maximum
- **Supported Formats**: All image types (JPG, PNG, GIF, WebP, etc.)

### Database Fields
When a profile picture is uploaded, these fields are added to the user document:
- `profilePictureUrl`: Public download URL from Firebase Storage
- `profilePicturePath`: Internal storage path for file management

### Components Used
- `ProfilePictureUpload`: Main upload component
- `ProfilePictureDisplay`: Display component for read-only views
- `profileService`: Service for handling uploads and deletions

## Firebase Storage Rules
Make sure your Firebase Storage rules allow profile picture uploads:

```javascript
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-pictures/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.metadata.userId;
    }
  }
}
```

## Security Features
- **User Isolation**: Users can only upload to their own profile folder
- **File Validation**: Server-side file type and size validation
- **Automatic Cleanup**: Old profile pictures are deleted when replaced
- **Access Control**: Only authenticated users can upload profile pictures

## Troubleshooting

### Common Issues
1. **"File must be an image"**: Ensure you're selecting an image file
2. **"File size must be less than 5MB"**: Compress or resize your image
3. **Upload fails**: Check Firebase Storage rules and internet connection
4. **Image not showing**: Clear browser cache or check Firebase Storage permissions

### File Size Optimization
- **Recommended**: Keep images under 1MB for faster loading
- **Format**: Use JPG for photos, PNG for graphics with transparency
- **Dimensions**: Square images work best (e.g., 400x400, 800x800)

## Future Enhancements
- Image cropping and resizing
- Multiple profile picture options
- Avatar customization
- Social media profile picture sync
