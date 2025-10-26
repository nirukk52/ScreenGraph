from __future__ import annotations
"""
Data Gathering Tools Interface

Handles all data collection operations from the mobile app.
This includes screenshots, page source, element information, and device data.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime

from ..types import ToolResult, SelectorType, Bounds, PlatformInfo, ScreenSize


class DataGatheringTools(ABC):
    """Abstract base class for data gathering tools."""
    
    @abstractmethod
    async def screenshot(self) -> ToolResult[str]:
        """
        Capture a full-screen screenshot
        
        Returns:
            Base64 encoded image data or URL reference
        """
        pass
    
    @abstractmethod
    async def get_page_source(self) -> ToolResult[str]:
        """
        Get the current page source/XML of the UI hierarchy
        
        Returns:
            Page source as XML string
        """
        pass
    
    @abstractmethod
    async def get_bounds_by_selector(self, selector_type: SelectorType, selector: str) -> ToolResult[Bounds]:
        """
        Return bounds for the first element matched by selector
        
        Args:
            selector_type: Type of selector to use
            selector: Selector value
            
        Returns:
            Element bounds information
        """
        pass
    
    @abstractmethod
    async def get_elements_by_selector(self, selector_type: SelectorType, selector: str) -> ToolResult[List['ElementInfo']]:
        """
        Get all elements matching the selector
        
        Args:
            selector_type: Type of selector to use
            selector: Selector value
            
        Returns:
            List of element information
        """
        pass
    
    @abstractmethod
    async def get_element_info(self, selector_type: SelectorType, selector: str) -> ToolResult['ElementInfo']:
        """
        Get element attributes and properties
        
        Args:
            selector_type: Type of selector to use
            selector: Selector value
            
        Returns:
            Element attributes and properties
        """
        pass
    
    @abstractmethod
    async def exists(self, selector_type: SelectorType, selector: str) -> ToolResult[bool]:
        """
        Check if at least one element matches the selector
        
        Args:
            selector_type: Type of selector to use
            selector: Selector value
            
        Returns:
            True if element exists
        """
        pass
    
    @abstractmethod
    async def wait_for(self, selector_type: SelectorType, selector: str, timeout_ms: int) -> ToolResult[bool]:
        """
        Wait until an element appears that matches selector or timeout
        
        Args:
            selector_type: Type of selector to use
            selector: Selector value
            timeout_ms: Timeout in milliseconds
            
        Returns:
            True if element found within timeout
        """
        pass
    
    @abstractmethod
    async def find_text(self, text: str) -> ToolResult[bool]:
        """
        Check if an element containing the given text is present
        
        Args:
            text: Text to search for
            
        Returns:
            True if text is found
        """
        pass
    
    @abstractmethod
    async def get_elements_by_text(self, text: str) -> ToolResult[List['ElementInfo']]:
        """
        Get all elements containing specific text
        
        Args:
            text: Text to search for
            
        Returns:
            List of elements containing the text
        """
        pass
    
    @abstractmethod
    async def get_platform_info(self) -> ToolResult[PlatformInfo]:
        """
        Get platform information (OS, version, device model)
        
        Returns:
            Platform details
        """
        pass
    
    @abstractmethod
    async def get_screen_size(self) -> ToolResult[ScreenSize]:
        """
        Get current screen size in pixels
        
        Returns:
            Screen dimensions
        """
        pass
    
    @abstractmethod
    async def get_scale_factor(self) -> ToolResult[float]:
        """
        Get scale factor (device pixel ratio) when available
        
        Returns:
            Scale factor value
        """
        pass
    
    @abstractmethod
    async def get_current_activity_or_view_controller(self) -> ToolResult[Optional[str]]:
        """
        Get current Android activity or iOS view controller name
        
        Returns:
            Current activity/view controller name
        """
        pass
    
    @abstractmethod
    async def get_orientation(self) -> ToolResult[str]:
        """
        Get device orientation
        
        Returns:
            Current device orientation
        """
        pass
    
    @abstractmethod
    async def get_clipboard(self) -> ToolResult[str]:
        """
        Get clipboard text content
        
        Returns:
            Clipboard text
        """
        pass
    
    @abstractmethod
    async def get_app_state(self) -> ToolResult['AppStateInfo']:
        """
        Get app state information
        
        Returns:
            Current app state details
        """
        pass
    
    @abstractmethod
    async def get_network_info(self) -> ToolResult['NetworkInfo']:
        """
        Get network information
        
        Returns:
            Network connection details
        """
        pass
    
    @abstractmethod
    async def get_device_logs(self, log_type: Optional[str] = None) -> ToolResult[List['LogEntry']]:
        """
        Get device logs (if available)
        
        Args:
            log_type: Type of logs to retrieve
            
        Returns:
            Log entries
        """
        pass


@dataclass
class ElementInfo:
    """Information about a UI element."""
    id: Optional[str] = None
    text: Optional[str] = None
    content_description: Optional[str] = None
    class_name: Optional[str] = None
    package_name: Optional[str] = None
    bounds: Optional[Bounds] = None
    enabled: bool = True
    selected: bool = False
    displayed: bool = True
    attributes: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.attributes is None:
            self.attributes = {}


@dataclass
class AppStateInfo:
    """Information about app state."""
    package_name: str
    activity_name: Optional[str] = None
    bundle_id: Optional[str] = None
    is_running: bool = False
    is_in_foreground: bool = False
    state: str = 'unknown'  # 'running', 'background', 'stopped', 'unknown'


@dataclass
class NetworkInfo:
    """Information about network connection."""
    connected: bool = False
    type: str = 'unknown'  # 'wifi', 'cellular', 'ethernet', 'unknown'
    strength: Optional[int] = None
    ssid: Optional[str] = None


@dataclass
class LogEntry:
    """A log entry from the device."""
    timestamp: datetime
    level: str  # 'debug', 'info', 'warn', 'error'
    message: str
    source: str
    tag: Optional[str] = None
