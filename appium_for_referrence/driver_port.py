"""
DriverPort: Device and App Automation Interface

PURPOSE:
--------
Abstract interface for device automation capabilities (Appium).
Enables EnsureDeviceNode, LaunchOrAttachNode, ActNode, etc.

DEPENDENCIES (ALLOWED):
-----------------------
- abc, typing (stdlib)
- domain types (UIElement, UIAction)

DEPENDENCIES (FORBIDDEN):
-------------------------
- NO Appium SDK imports
- NO concrete driver implementations
- NO network/socket code

METHODS:
--------
- is_device_ready() -> bool: Check device connectivity
- install_app(apk_path: str) -> bool: Install app package
- launch_app(package: str) -> bool: Open app
- get_current_app() -> str: Current foreground package
- get_page_source() -> str: XML/JSON hierarchy
- get_screenshot() -> bytes: PNG screenshot
- tap(x: float, y: float): Tap at normalized coordinates
- swipe(start_x, start_y, end_x, end_y, duration_ms): Swipe gesture
- type_text(text: str): Enter text into focused element
- press_back(): Navigate back
- press_home(): Go to home screen
- restart_app(package: str): Force stop and relaunch

ERROR HANDLING:
---------------
- DeviceOfflineError: Device disconnected
- AppNotInstalledError: Package not found
- AppCrashedError: App stopped unexpectedly
- TimeoutError: Operation exceeded threshold

RETRIES:
--------
Adapter is responsible for transient retry logic.
Ports should return clear errors for permanent failures.

TODO:
-----
- [ ] Add element location methods (find_by_xpath, find_by_id)
- [ ] Add advanced gestures (pinch, zoom, rotate)
- [ ] Add device info queries (screen size, OS version)
"""

from abc import ABC, abstractmethod
from typing import List, Optional
# from ..domain.ui_element import UIElement


class DriverPort(ABC):
    """
    Interface for device and app automation.
    Implemented by adapters/appium.
    """
    
    @abstractmethod
    async def is_device_ready(self) -> bool:
        """
        Check if device is connected and responsive.
        
        Returns:
            True if device is ready, False otherwise.
        
        Raises:
            DeviceOfflineError: If device is permanently offline.
        """
        pass
    
    @abstractmethod
    async def install_app(self, apk_path: str) -> bool:
        """
        Install app package from path.
        
        Args:
            apk_path: Path to APK file.
        
        Returns:
            True if installation succeeded.
        
        Raises:
            AppNotInstalledError: If installation failed.
        """
        pass
    
    @abstractmethod
    async def launch_app(self, package: str) -> bool:
        """
        Launch app by package name.
        
        Args:
            package: Android package name (e.g., com.example.app).
        
        Returns:
            True if launch succeeded.
        
        Raises:
            AppNotInstalledError: If package not found.
            AppCrashedError: If app crashed on launch.
        """
        pass
    
    @abstractmethod
    async def get_current_app(self) -> str:
        """
        Get foreground app package name.
        
        Returns:
            Package name (e.g., com.android.launcher).
        """
        pass
    
    @abstractmethod
    async def get_page_source(self) -> str:
        """
        Capture UI hierarchy as XML/JSON.
        
        Returns:
            XML string (Android) or JSON (iOS).
        
        Raises:
            TimeoutError: If capture timed out.
        """
        pass
    
    @abstractmethod
    async def get_screenshot(self) -> bytes:
        """
        Capture screenshot as PNG bytes.
        
        Returns:
            PNG image bytes.
        
        Raises:
            TimeoutError: If capture timed out.
        """
        pass
    
    @abstractmethod
    async def tap(self, x: float, y: float) -> None:
        """
        Tap at normalized coordinates [0.0, 1.0].
        
        Args:
            x: Horizontal position (0.0 = left, 1.0 = right).
            y: Vertical position (0.0 = top, 1.0 = bottom).
        
        Raises:
            TimeoutError: If tap timed out.
        """
        pass
    
    @abstractmethod
    async def swipe(
        self,
        start_x: float,
        start_y: float,
        end_x: float,
        end_y: float,
        duration_ms: int = 300,
    ) -> None:
        """
        Swipe from start to end coordinates.
        
        Args:
            start_x, start_y: Start position (normalized).
            end_x, end_y: End position (normalized).
            duration_ms: Swipe duration in milliseconds.
        
        Raises:
            TimeoutError: If swipe timed out.
        """
        pass
    
    @abstractmethod
    async def type_text(self, text: str) -> None:
        """
        Type text into focused element.
        
        Args:
            text: Text to type.
        
        Raises:
            TimeoutError: If typing timed out.
        """
        pass
    
    @abstractmethod
    async def press_back(self) -> None:
        """Navigate back (hardware or software back button)."""
        pass
    
    @abstractmethod
    async def press_home(self) -> None:
        """Go to home screen."""
        pass
    
    @abstractmethod
    async def restart_app(self, package: str) -> bool:
        """
        Force stop and relaunch app.
        
        Args:
            package: Package name.
        
        Returns:
            True if restart succeeded.
        
        Raises:
            AppCrashedError: If app crashed on restart.
        """
        pass

