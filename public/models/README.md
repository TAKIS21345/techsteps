# Avatar Models

This directory contains 3D avatar models for the senior learning platform.

## Default Avatar

The `default-senior-avatar.vrm` file should contain a friendly, approachable 3D avatar optimized for senior users. 

For development purposes, the system will create a fallback geometric avatar if no VRM model is available.

## Ready Player Me Integration

The system supports Ready Player Me avatars. To use a Ready Player Me avatar:

1. Create an avatar at https://readyplayer.me/
2. Get the avatar ID from the URL
3. The system will automatically load it using the Ready Player Me API

## VRM Format

All avatars should be in VRM format for maximum compatibility with the lip sync system and expression controls.