from __future__ import annotations
"""
Device Management Tools Interface

Handles all device-level operations including orientation, permissions, 
system interactions, and device state management.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime

from ..types import ToolResult, DeviceOrientation, SystemPermission, AppInfo, DeepLinkInfo


class DeviceManagementTools(ABC):
    """Abstract base class for device management tools."""
    
    @abstractmethod
    async def set_orientation(self, orientation: DeviceOrientation) -> ToolResult[bool]:
        """
        Set device orientation
        
        Args:
            orientation: Target orientation
            
        Returns:
            Success status of orientation change
        """
        pass
    
    @abstractmethod
    async def get_orientation(self) -> ToolResult[DeviceOrientation]:
        """
        Get current device orientation
        
        Returns:
            Current orientation
        """
        pass
    
    @abstractmethod
    async def lock_screen(self) -> ToolResult[bool]:
        """
        Lock the device screen
        
        Returns:
            Success status of screen lock
        """
        pass
    
    @abstractmethod
    async def unlock_screen(self) -> ToolResult[bool]:
        """
        Unlock the device screen
        
        Returns:
            Success status of screen unlock
        """
        pass
    
    @abstractmethod
    async def is_screen_locked(self) -> ToolResult[bool]:
        """
        Check if device screen is locked
        
        Returns:
            Screen lock status
        """
        pass
    
    @abstractmethod
    async def set_clipboard(self, text: str) -> ToolResult[bool]:
        """
        Set clipboard text content
        
        Args:
            text: Text to set in clipboard
            
        Returns:
            Success status of clipboard setting
        """
        pass
    
    @abstractmethod
    async def get_clipboard(self) -> ToolResult[str]:
        """
        Get clipboard text content
        
        Returns:
            Clipboard text content
        """
        pass
    
    @abstractmethod
    async def accept_system_permission(self, permission: SystemPermission) -> ToolResult[bool]:
        """
        Accept a system permission dialog by permission name when possible
        
        Args:
            permission: Permission to accept
            
        Returns:
            Success status of permission acceptance
        """
        pass
    
    @abstractmethod
    async def deny_system_permission(self, permission: SystemPermission) -> ToolResult[bool]:
        """
        Deny a system permission dialog by permission name when possible
        
        Args:
            permission: Permission to deny
            
        Returns:
            Success status of permission denial
        """
        pass
    
    @abstractmethod
    async def is_permission_granted(self, permission: SystemPermission) -> ToolResult[bool]:
        """
        Check if a permission is granted
        
        Args:
            permission: Permission to check
            
        Returns:
            Permission status
        """
        pass
    
    @abstractmethod
    async def open_settings(self) -> ToolResult[bool]:
        """
        Open device settings
        
        Returns:
            Success status of settings opening
        """
        pass
    
    @abstractmethod
    async def open_settings_page(self, settings_page: 'SettingsPage') -> ToolResult[bool]:
        """
        Open a specific settings page
        
        Args:
            settings_page: Specific settings page to open
            
        Returns:
            Success status of settings page opening
        """
        pass
    
    @abstractmethod
    async def press_back_button(self) -> ToolResult[bool]:
        """
        Press device back button
        
        Returns:
            Success status of back button press
        """
        pass
    
    @abstractmethod
    async def press_home_button(self) -> ToolResult[bool]:
        """
        Press device home button
        
        Returns:
            Success status of home button press
        """
        pass
    
    @abstractmethod
    async def press_menu_button(self) -> ToolResult[bool]:
        """
        Press device menu button (if available)
        
        Returns:
            Success status of menu button press
        """
        pass
    
    @abstractmethod
    async def press_recent_apps_button(self) -> ToolResult[bool]:
        """
        Press device recent apps button (if available)
        
        Returns:
            Success status of recent apps button press
        """
        pass
    
    @abstractmethod
    async def press_power_button(self) -> ToolResult[bool]:
        """
        Press device power button
        
        Returns:
            Success status of power button press
        """
        pass
    
    @abstractmethod
    async def press_volume_up(self) -> ToolResult[bool]:
        """
        Press device volume up button
        
        Returns:
            Success status of volume up press
        """
        pass
    
    @abstractmethod
    async def press_volume_down(self) -> ToolResult[bool]:
        """
        Press device volume down button
        
        Returns:
            Success status of volume down press
        """
        pass
    
    @abstractmethod
    async def set_volume(self, level: float) -> ToolResult[bool]:
        """
        Set device volume level
        
        Args:
            level: Volume level (0.0 to 1.0)
            
        Returns:
            Success status of volume setting
        """
        pass
    
    @abstractmethod
    async def get_volume(self) -> ToolResult[float]:
        """
        Get current device volume level
        
        Returns:
            Current volume level
        """
        pass
    
    @abstractmethod
    async def set_airplane_mode(self, enabled: bool) -> ToolResult[bool]:
        """
        Enable/disable airplane mode
        
        Args:
            enabled: Whether to enable airplane mode
            
        Returns:
            Success status of airplane mode change
        """
        pass
    
    @abstractmethod
    async def is_airplane_mode_enabled(self) -> ToolResult[bool]:
        """
        Check if airplane mode is enabled
        
        Returns:
            Airplane mode status
        """
        pass
    
    @abstractmethod
    async def set_wifi(self, enabled: bool) -> ToolResult[bool]:
        """
        Enable/disable WiFi
        
        Args:
            enabled: Whether to enable WiFi
            
        Returns:
            Success status of WiFi change
        """
        pass
    
    @abstractmethod
    async def is_wifi_enabled(self) -> ToolResult[bool]:
        """
        Check if WiFi is enabled
        
        Returns:
            WiFi status
        """
        pass
    
    @abstractmethod
    async def set_bluetooth(self, enabled: bool) -> ToolResult[bool]:
        """
        Enable/disable Bluetooth
        
        Args:
            enabled: Whether to enable Bluetooth
            
        Returns:
            Success status of Bluetooth change
        """
        pass
    
    @abstractmethod
    async def is_bluetooth_enabled(self) -> ToolResult[bool]:
        """
        Check if Bluetooth is enabled
        
        Returns:
            Bluetooth status
        """
        pass
    
    @abstractmethod
    async def set_location_services(self, enabled: bool) -> ToolResult[bool]:
        """
        Enable/disable location services
        
        Args:
            enabled: Whether to enable location services
            
        Returns:
            Success status of location services change
        """
        pass
    
    @abstractmethod
    async def is_location_services_enabled(self) -> ToolResult[bool]:
        """
        Check if location services are enabled
        
        Returns:
            Location services status
        """
        pass
    
    @abstractmethod
    async def set_date_time(self, date_time: datetime) -> ToolResult[bool]:
        """
        Set device date and time
        
        Args:
            date_time: Target date and time
            
        Returns:
            Success status of date/time setting
        """
        pass
    
    @abstractmethod
    async def get_date_time(self) -> ToolResult[datetime]:
        """
        Get current device date and time
        
        Returns:
            Current date and time
        """
        pass
    
    @abstractmethod
    async def set_timezone(self, timezone: str) -> ToolResult[bool]:
        """
        Set device timezone
        
        Args:
            timezone: Timezone identifier
            
        Returns:
            Success status of timezone setting
        """
        pass
    
    @abstractmethod
    async def get_timezone(self) -> ToolResult[str]:
        """
        Get current device timezone
        
        Returns:
            Current timezone
        """
        pass
    
    @abstractmethod
    async def rotate_to_landscape(self) -> ToolResult[bool]:
        """
        Rotate device to landscape mode
        
        Returns:
            Success status of rotation
        """
        pass
    
    @abstractmethod
    async def rotate_to_portrait(self) -> ToolResult[bool]:
        """
        Rotate device to portrait mode
        
        Returns:
            Success status of rotation
        """
        pass
    
    @abstractmethod
    async def shake_device(self) -> ToolResult[bool]:
        """
        Shake the device (if supported)
        
        Returns:
            Success status of shake action
        """
        pass
    
    @abstractmethod
    async def get_battery_level(self) -> ToolResult[float]:
        """
        Get device battery level
        
        Returns:
            Battery level percentage
        """
        pass
    
    @abstractmethod
    async def is_charging(self) -> ToolResult[bool]:
        """
        Check if device is charging
        
        Returns:
            Charging status
        """
        pass
    
    @abstractmethod
    async def get_memory_info(self) -> ToolResult['MemoryInfo']:
        """
        Get device memory usage information
        
        Returns:
            Memory usage details
        """
        pass
    
    @abstractmethod
    async def get_storage_info(self) -> ToolResult['StorageInfo']:
        """
        Get device storage information
        
        Returns:
            Storage usage details
        """
        pass


class SettingsPage:
    """Settings page identifiers."""
    WIFI = 'wifi'
    BLUETOOTH = 'bluetooth'
    LOCATION = 'location'
    NOTIFICATIONS = 'notifications'
    APPS = 'apps'
    DISPLAY = 'display'
    SOUND = 'sound'
    STORAGE = 'storage'
    SECURITY = 'security'
    ACCOUNTS = 'accounts'
    ACCESSIBILITY = 'accessibility'
    DEVELOPER_OPTIONS = 'developer_options'


@dataclass
class MemoryInfo:
    """Information about device memory usage."""
    total_memory: int
    available_memory: int
    used_memory: int
    memory_usage_percentage: float


@dataclass
class StorageInfo:
    """Information about device storage usage."""
    total_storage: int
    available_storage: int
    used_storage: int
    storage_usage_percentage: float
