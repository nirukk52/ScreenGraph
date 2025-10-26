from __future__ import annotations
"""
Navigation Tools Interface

Handles all navigation-related operations including back button, 
home button, and app switching functionality.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime

from ..types import ToolResult


class NavigationTools(ABC):
    """Abstract base class for navigation tools."""
    
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
    async def open_recent_apps(self) -> ToolResult[bool]:
        """
        Open recent apps overview
        
        Returns:
            Success status of recent apps opening
        """
        pass
    
    @abstractmethod
    async def close_recent_apps(self) -> ToolResult[bool]:
        """
        Close recent apps overview
        
        Returns:
            Success status of recent apps closing
        """
        pass
    
    @abstractmethod
    async def switch_to_next_app(self) -> ToolResult[bool]:
        """
        Switch to the next app in recent apps
        
        Returns:
            Success status of app switching
        """
        pass
    
    @abstractmethod
    async def switch_to_previous_app(self) -> ToolResult[bool]:
        """
        Switch to the previous app in recent apps
        
        Returns:
            Success status of app switching
        """
        pass
    
    @abstractmethod
    async def switch_to_app(self, package_name: str) -> ToolResult[bool]:
        """
        Switch to a specific app by package name
        
        Args:
            package_name: Package name or bundle ID
            
        Returns:
            Success status of app switching
        """
        pass
    
    @abstractmethod
    async def get_current_app(self) -> ToolResult[Optional[str]]:
        """
        Get current app in focus
        
        Returns:
            Current app information
        """
        pass
    
    @abstractmethod
    async def get_recent_apps(self) -> ToolResult[List[str]]:
        """
        Get list of recent apps
        
        Returns:
            List of recent app package names
        """
        pass
    
    @abstractmethod
    async def clear_recent_apps(self) -> ToolResult[bool]:
        """
        Clear recent apps list
        
        Returns:
            Success status of recent apps clearing
        """
        pass
    
    @abstractmethod
    async def go_to_home_screen(self) -> ToolResult[bool]:
        """
        Navigate to app drawer/home screen
        
        Returns:
            Success status of navigation
        """
        pass
    
    @abstractmethod
    async def open_app_drawer(self) -> ToolResult[bool]:
        """
        Open app drawer
        
        Returns:
            Success status of app drawer opening
        """
        pass
    
    @abstractmethod
    async def close_app_drawer(self) -> ToolResult[bool]:
        """
        Close app drawer
        
        Returns:
            Success status of app drawer closing
        """
        pass
    
    @abstractmethod
    async def search_apps(self, search_term: str) -> ToolResult[bool]:
        """
        Search for an app in app drawer
        
        Args:
            search_term: Search term
            
        Returns:
            Success status of search
        """
        pass
    
    @abstractmethod
    async def clear_app_search(self) -> ToolResult[bool]:
        """
        Clear app search
        
        Returns:
            Success status of search clearing
        """
        pass
    
    @abstractmethod
    async def open_quick_settings(self) -> ToolResult[bool]:
        """
        Open quick settings panel
        
        Returns:
            Success status of quick settings opening
        """
        pass
    
    @abstractmethod
    async def close_quick_settings(self) -> ToolResult[bool]:
        """
        Close quick settings panel
        
        Returns:
            Success status of quick settings closing
        """
        pass
    
    @abstractmethod
    async def open_notifications(self) -> ToolResult[bool]:
        """
        Open notification panel
        
        Returns:
            Success status of notification panel opening
        """
        pass
    
    @abstractmethod
    async def close_notifications(self) -> ToolResult[bool]:
        """
        Close notification panel
        
        Returns:
            Success status of notification panel closing
        """
        pass
    
    @abstractmethod
    async def clear_all_notifications(self) -> ToolResult[bool]:
        """
        Clear all notifications
        
        Returns:
            Success status of notifications clearing
        """
        pass
    
    @abstractmethod
    async def dismiss_notification(self, notification_id: str) -> ToolResult[bool]:
        """
        Dismiss specific notification
        
        Args:
            notification_id: Notification ID or index
            
        Returns:
            Success status of notification dismissal
        """
        pass
    
    @abstractmethod
    async def get_notifications(self) -> ToolResult[List['NotificationInfo']]:
        """
        Get list of current notifications
        
        Returns:
            List of notification information
        """
        pass
    
    @abstractmethod
    async def navigate_to_setting(self, setting_path: str) -> ToolResult[bool]:
        """
        Navigate to specific system setting
        
        Args:
            setting_path: Path to the setting (e.g., 'wifi', 'bluetooth')
            
        Returns:
            Success status of navigation
        """
        pass
    
    @abstractmethod
    async def go_back(self) -> ToolResult[bool]:
        """
        Go back to previous screen/page
        
        Returns:
            Success status of going back
        """
        pass
    
    @abstractmethod
    async def can_go_back(self) -> ToolResult[bool]:
        """
        Check if back navigation is available
        
        Returns:
            Back navigation availability
        """
        pass
    
    @abstractmethod
    async def get_current_screen_title(self) -> ToolResult[Optional[str]]:
        """
        Get current screen/page title
        
        Returns:
            Current screen title
        """
        pass
    
    @abstractmethod
    async def get_current_screen_url(self) -> ToolResult[Optional[str]]:
        """
        Get current screen/page URL (for webviews)
        
        Returns:
            Current screen URL
        """
        pass
    
    @abstractmethod
    async def refresh_screen(self) -> ToolResult[bool]:
        """
        Refresh current screen/page
        
        Returns:
            Success status of screen refresh
        """
        pass
    
    @abstractmethod
    async def scroll_to_top(self) -> ToolResult[bool]:
        """
        Scroll to top of current screen
        
        Returns:
            Success status of scrolling
        """
        pass
    
    @abstractmethod
    async def scroll_to_bottom(self) -> ToolResult[bool]:
        """
        Scroll to bottom of current screen
        
        Returns:
            Success status of scrolling
        """
        pass
    
    @abstractmethod
    async def pull_to_refresh(self) -> ToolResult[bool]:
        """
        Perform pull-to-refresh gesture
        
        Returns:
            Success status of pull-to-refresh
        """
        pass
    
    @abstractmethod
    async def open_context_menu(self) -> ToolResult[bool]:
        """
        Open context menu (long press on empty area)
        
        Returns:
            Success status of context menu opening
        """
        pass
    
    @abstractmethod
    async def close_context_menu(self) -> ToolResult[bool]:
        """
        Close context menu
        
        Returns:
            Success status of context menu closing
        """
        pass


@dataclass
class NotificationInfo:
    """Information about a notification."""
    id: str
    title: str
    text: str
    package_name: str
    timestamp: datetime
    is_ongoing: bool
    is_clearable: bool
    priority: str  # 'low', 'normal', 'high', 'max'
    category: Optional[str] = None
