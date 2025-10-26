from __future__ import annotations
"""
App Management Tools Interface

Handles all application lifecycle operations including installation, 
launching, closing, and app state management.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime

from ..types import ToolResult, AppInfo, DeepLinkInfo


class AppManagementTools(ABC):
    """Abstract base class for app management tools."""
    
    @abstractmethod
    async def install(self, app_path: str) -> ToolResult[bool]:
        """
        Install an app from a local path
        
        Args:
            app_path: Path to the app file (APK/IPA)
            
        Returns:
            Success status of installation
        """
        pass
    
    @abstractmethod
    async def uninstall(self, package_name: str) -> ToolResult[bool]:
        """
        Uninstall app by bundle ID or package name
        
        Args:
            package_name: Package name or bundle ID
            
        Returns:
            Success status of uninstallation
        """
        pass
    
    @abstractmethod
    async def launch_app(self, package_name: str, activity_name: Optional[str] = None) -> ToolResult[bool]:
        """
        Launch an app by package name or bundle ID
        
        Args:
            package_name: Package name or bundle ID
            activity_name: Android activity name (optional)
            
        Returns:
            Success status of app launch
        """
        pass
    
    @abstractmethod
    async def close_app(self) -> ToolResult[bool]:
        """
        Close the foreground app (kept installed)
        
        Returns:
            Success status of app closing
        """
        pass
    
    @abstractmethod
    async def terminate(self, package_name: str) -> ToolResult[bool]:
        """
        Terminate the app by bundle ID or package name
        
        Args:
            package_name: Package name or bundle ID
            
        Returns:
            Success status of app termination
        """
        pass
    
    @abstractmethod
    async def reset_app(self, package_name: str) -> ToolResult[bool]:
        """
        Reset application data (cold start state)
        
        Args:
            package_name: Package name or bundle ID
            
        Returns:
            Success status of app reset
        """
        pass
    
    @abstractmethod
    async def background_app(self, milliseconds: int) -> ToolResult[bool]:
        """
        Send app to background for the given duration
        
        Args:
            milliseconds: Duration in background
            
        Returns:
            Success status of backgrounding
        """
        pass
    
    @abstractmethod
    async def foreground_app(self, package_name: str) -> ToolResult[bool]:
        """
        Bring app to foreground
        
        Args:
            package_name: Package name or bundle ID
            
        Returns:
            Success status of foregrounding
        """
        pass
    
    @abstractmethod
    async def is_app_installed(self, package_name: str) -> ToolResult[bool]:
        """
        Check if an app is installed
        
        Args:
            package_name: Package name or bundle ID
            
        Returns:
            Installation status
        """
        pass
    
    @abstractmethod
    async def is_app_running(self, package_name: str) -> ToolResult[bool]:
        """
        Check if an app is currently running
        
        Args:
            package_name: Package name or bundle ID
            
        Returns:
            Running status
        """
        pass
    
    @abstractmethod
    async def get_app_info(self, package_name: str) -> ToolResult[AppInfo]:
        """
        Get app information
        
        Args:
            package_name: Package name or bundle ID
            
        Returns:
            App information details
        """
        pass
    
    @abstractmethod
    async def get_installed_apps(self, system_apps: bool = False) -> ToolResult[List[AppInfo]]:
        """
        Get list of installed apps
        
        Args:
            system_apps: Whether to include system apps
            
        Returns:
            List of installed apps
        """
        pass
    
    @abstractmethod
    async def get_running_apps(self) -> ToolResult[List[AppInfo]]:
        """
        Get currently running apps
        
        Returns:
            List of running apps
        """
        pass
    
    @abstractmethod
    async def get_current_app(self) -> ToolResult[Optional[AppInfo]]:
        """
        Get current foreground app
        
        Returns:
            Current foreground app information
        """
        pass
    
    @abstractmethod
    async def open_deep_link(self, url: str) -> ToolResult[bool]:
        """
        Open a deep link URL inside the device
        
        Args:
            url: Deep link URL
            
        Returns:
            Success status of deep link opening
        """
        pass
    
    @abstractmethod
    async def parse_deep_link(self, url: str) -> ToolResult[DeepLinkInfo]:
        """
        Parse and validate a deep link URL
        
        Args:
            url: Deep link URL to parse
            
        Returns:
            Parsed deep link information
        """
        pass
    
    @abstractmethod
    async def start_app_with_extras(self, package_name: str, activity_name: str, extras: Dict[str, Any]) -> ToolResult[bool]:
        """
        Start an app with specific intent extras (Android)
        
        Args:
            package_name: Package name
            activity_name: Activity name
            extras: Intent extras
            
        Returns:
            Success status of app start with extras
        """
        pass
    
    @abstractmethod
    async def clear_app_data(self, package_name: str) -> ToolResult[bool]:
        """
        Clear app data and cache
        
        Args:
            package_name: Package name or bundle ID
            
        Returns:
            Success status of data clearing
        """
        pass
    
    @abstractmethod
    async def grant_app_permissions(self, package_name: str, permissions: List[str]) -> ToolResult[bool]:
        """
        Grant app permissions
        
        Args:
            package_name: Package name or bundle ID
            permissions: Array of permissions to grant
            
        Returns:
            Success status of permission granting
        """
        pass
    
    @abstractmethod
    async def revoke_app_permissions(self, package_name: str, permissions: List[str]) -> ToolResult[bool]:
        """
        Revoke app permissions
        
        Args:
            package_name: Package name or bundle ID
            permissions: Array of permissions to revoke
            
        Returns:
            Success status of permission revoking
        """
        pass
    
    @abstractmethod
    async def get_app_permissions(self, package_name: str) -> ToolResult[List[str]]:
        """
        Get app permissions
        
        Args:
            package_name: Package name or bundle ID
            
        Returns:
            List of app permissions
        """
        pass
    
    @abstractmethod
    async def has_app_permission(self, package_name: str, permission: str) -> ToolResult[bool]:
        """
        Check if app has specific permission
        
        Args:
            package_name: Package name or bundle ID
            permission: Permission to check
            
        Returns:
            Permission status
        """
        pass
    
    @abstractmethod
    async def set_app_enabled(self, package_name: str, enabled: bool) -> ToolResult[bool]:
        """
        Enable/disable app
        
        Args:
            package_name: Package name or bundle ID
            enabled: Whether to enable the app
            
        Returns:
            Success status of app enable/disable
        """
        pass
    
    @abstractmethod
    async def is_app_enabled(self, package_name: str) -> ToolResult[bool]:
        """
        Check if app is enabled
        
        Args:
            package_name: Package name or bundle ID
            
        Returns:
            App enabled status
        """
        pass
    
    @abstractmethod
    async def get_app_version(self, package_name: str) -> ToolResult['AppVersionInfo']:
        """
        Get app version information
        
        Args:
            package_name: Package name or bundle ID
            
        Returns:
            App version details
        """
        pass
    
    @abstractmethod
    async def update_app(self, app_path: str, package_name: str) -> ToolResult[bool]:
        """
        Update app from file
        
        Args:
            app_path: Path to the new app file
            package_name: Package name or bundle ID
            
        Returns:
            Success status of app update
        """
        pass
    
    @abstractmethod
    async def launch_app_with_config(self, config: 'AppLaunchConfig') -> ToolResult[bool]:
        """
        Launch app with specific configuration
        
        Args:
            config: App launch configuration
            
        Returns:
            Success status of app launch
        """
        pass
    
    @abstractmethod
    async def stop_all_apps(self) -> ToolResult[bool]:
        """
        Stop all apps except system apps
        
        Returns:
            Success status of app stopping
        """
        pass
    
    @abstractmethod
    async def restart_device(self) -> ToolResult[bool]:
        """
        Restart device
        
        Returns:
            Success status of device restart
        """
        pass
    
    @abstractmethod
    async def shutdown_device(self) -> ToolResult[bool]:
        """
        Shutdown device
        
        Returns:
            Success status of device shutdown
        """
        pass


@dataclass
class AppVersionInfo:
    """Information about app version."""
    version_name: str
    version_code: int
    package_name: str
    min_sdk_version: Optional[int] = None
    target_sdk_version: Optional[int] = None


@dataclass
class AppLaunchConfig:
    """Configuration for app launch."""
    package_name: str
    activity_name: Optional[str] = None
    bundle_id: Optional[str] = None
    wait_for_launch: bool = True
    timeout: Optional[int] = None
    clear_data: bool = False
    no_stop: bool = False
    full_reset: bool = False
    new_command_timeout: Optional[int] = None
    auto_accept_alerts: bool = False
    auto_dismiss_alerts: bool = False
    capabilities: Optional[Dict[str, Any]] = None
