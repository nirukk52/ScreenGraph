"""
AppiumAdapter: DriverPort Implementation

PURPOSE:
--------
Implements DriverPort interface using Appium WebDriver.
Wraps existing Appium tooling and maps to clean architecture contracts.

RESPONSIBILITIES:
-----------------
- Implement all DriverPort methods
- Map Appium/Selenium exceptions to domain errors
- Add retry logic for transient failures
- Normalize coordinates and timeout handling
- Return domain types, not SDK types

ALLOWED DEPENDENCIES:
---------------------
- src.agent.ports.driver_port (DriverPort interface)
- src.agent.errors.error_types (domain exceptions)
- src.adapters.appium (existing Appium tools)
- appium, selenium (SDK imports)
- typing, dataclasses (stdlib)

FORBIDDEN DEPENDENCIES:
-----------------------
- NO other adapters
- NO agent.domain (use ports only)
- NO agent.orchestrator

INPUTS:
-------
- config: AppiumConfig with connection details
- timeout_ms: Default timeout for operations

OUTPUTS/EFFECTS:
----------------
- Returns: None for actions, domain types for queries
- Side effects: Device automation (tap, type, swipe, etc.)
- Raises: Domain exceptions (DeviceOfflineError, etc.)

INVARIANTS:
-----------
- All coordinates normalized to [0.0, 1.0]
- All timeouts bounded (max 30s)
- All errors mapped to domain exceptions

ERROR MAPPING:
--------------
- NoSuchElementException → ElementNotFoundError
- TimeoutException → ActionTimeoutError
- WebDriverException → DeviceOfflineError
- InvalidSessionIdException → DeviceOfflineError
- UnknownError → ActionFailedError

TODO:
-----
- [x] Implement DriverPort interface
- [x] Add error mapping decorator
- [x] Add retry logic
- [ ] Add coordinate validation
- [ ] Add timeout enforcement
- [ ] Add telemetry hooks
- [ ] Add integration tests
"""

from abc import ABC
from typing import Optional, Tuple, List, Dict, Any
import asyncio
import logging
from functools import wraps
from datetime import datetime

# Port interface
from src.agent.ports.driver_port import DriverPort

# Domain errors
from src.agent.errors.error_types import (
    DeviceOfflineError,
    ActionTimeoutError,
    ElementNotFoundError,
    ActionFailedError,
    AppCrashedError,
)

# Existing Appium tools (will be refactored)
# Import directly to avoid circular dependency
from src.adapters.appium.factory import (
    create_appium_tools,
    create_driver_config,
    create_execution_context,
)

# SDK imports (ONLY in adapters)
try:
    from selenium.common.exceptions import (
        NoSuchElementException,
        TimeoutException,
        WebDriverException,
        InvalidSessionIdException,
        UnknownError,
    )
except ImportError:
    # Graceful degradation for environments without Selenium
    pass

logger = logging.getLogger(__name__)


def map_error(func):
    """
    Decorator to map Appium/Selenium exceptions to domain errors.
    
    Implements Rule 23: Unified Error Enums
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except NoSuchElementException as e:
            logger.error(f"Element not found: {e}")
            raise ElementNotFoundError(str(e)) from e
        except TimeoutException as e:
            logger.error(f"Operation timeout: {e}")
            raise ActionTimeoutError(str(e)) from e
        except InvalidSessionIdException as e:
            logger.error(f"Invalid session: {e}")
            raise DeviceOfflineError("Device session lost") from e
        except WebDriverException as e:
            logger.error(f"WebDriver error: {e}")
            raise DeviceOfflineError(str(e)) from e
        except UnknownError as e:
            logger.error(f"Unknown Appium error: {e}")
            raise ActionFailedError(str(e)) from e
        except Exception as e:
            logger.exception(f"Unexpected error in {func.__name__}")
            raise ActionFailedError(f"Unexpected error: {e}") from e
    
    return wrapper


def retry_on_transient(max_attempts: int = 3, backoff_ms: List[int] = None):
    """
    Decorator to retry operations on transient failures.
    
    Args:
        max_attempts: Maximum retry attempts
        backoff_ms: Backoff delays in milliseconds [100, 200, 400]
    """
    if backoff_ms is None:
        backoff_ms = [100, 200, 400]
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_error = None
            
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except (ActionTimeoutError, DeviceOfflineError) as e:
                    last_error = e
                    if attempt < max_attempts - 1:
                        delay_ms = backoff_ms[min(attempt, len(backoff_ms) - 1)]
                        logger.warning(
                            f"Attempt {attempt + 1}/{max_attempts} failed: {e}. "
                            f"Retrying in {delay_ms}ms..."
                        )
                        await asyncio.sleep(delay_ms / 1000)
                        continue
                    break
            
            # All retries exhausted
            logger.error(f"All {max_attempts} attempts failed")
            raise last_error
        
        return wrapper
    return decorator


class AppiumAdapter(DriverPort):
    """
    Appium implementation of DriverPort.
    
    Wraps existing Appium tooling and implements clean architecture contracts.
    
    IMMUTABILITY:
    - Config is frozen at construction
    - No mutable state except connection handle
    
    TIMEOUTS:
    - All operations have bounded timeouts (default 10s, max 30s)
    - Configurable via constructor
    
    COORDINATES:
    - All coordinates normalized to [0.0, 1.0]
    - Origin at top-left (0, 0)
    - Bottom-right at (1.0, 1.0)
    """
    
    def __init__(
        self,
        hub_url: str,
        platform: str,
        timeout_ms: int = 10000,
        max_timeout_ms: int = 30000,
    ):
        """
        Initialize AppiumAdapter.
        
        Args:
            hub_url: Appium server URL (e.g., http://localhost:4723)
            platform: Platform name ("android" or "ios")
            timeout_ms: Default timeout in milliseconds
            max_timeout_ms: Maximum allowed timeout
        """
        self.hub_url = hub_url
        self.platform = platform.lower()
        self.timeout_ms = min(timeout_ms, max_timeout_ms)
        self.max_timeout_ms = max_timeout_ms
        
        # Initialize Appium tools (existing implementation)
        self._driver_config = None
        self._tools = None
        self._context = None
        
        logger.info(
            f"AppiumAdapter initialized: platform={platform}, "
            f"timeout={timeout_ms}ms, hub={hub_url}"
        )
    
    async def connect(self) -> None:
        """
        Establish connection to Appium server and device.
        
        Raises:
            DeviceOfflineError: If connection fails
        """
        try:
            self._driver_config = create_driver_config(
                hub_url=self.hub_url,
                platform=self.platform,
            )
            self._context = create_execution_context()
            self._tools = await create_appium_tools(
                config=self._driver_config,
                context=self._context,
            )
            logger.info("Connected to Appium server and device")
        except Exception as e:
            logger.error(f"Failed to connect: {e}")
            raise DeviceOfflineError(f"Connection failed: {e}") from e
    
    async def disconnect(self) -> None:
        """
        Close connection to device.
        """
        if self._tools:
            try:
                # Close driver session
                if hasattr(self._tools, "driver"):
                    await self._tools.driver.quit()
                logger.info("Disconnected from device")
            except Exception as e:
                logger.warning(f"Error during disconnect: {e}")
        
        self._tools = None
        self._context = None
        self._driver_config = None
    
    @map_error
    @retry_on_transient(max_attempts=2)
    async def tap(self, x: float, y: float) -> None:
        """
        Tap at normalized coordinates.
        
        Args:
            x: Normalized X coordinate [0.0, 1.0]
            y: Normalized Y coordinate [0.0, 1.0]
        
        Raises:
            DeviceOfflineError: Device unreachable
            ActionTimeoutError: Operation timeout
            ActionFailedError: Tap failed
        """
        self._validate_coordinates(x, y)
        
        if not self._tools:
            raise DeviceOfflineError("Not connected to device")
        
        # Convert normalized to absolute coordinates
        screen_size = await self._get_screen_size()
        abs_x = int(x * screen_size[0])
        abs_y = int(y * screen_size[1])
        
        logger.debug(f"Tapping at ({x}, {y}) -> absolute ({abs_x}, {abs_y})")
        
        # Use existing Appium tools
        await self._tools.tap(abs_x, abs_y)
    
    @map_error
    async def type_text(self, text: str) -> None:
        """
        Type text into focused element.
        
        Args:
            text: Text to type
        
        Raises:
            DeviceOfflineError: Device unreachable
            ActionTimeoutError: Operation timeout
        """
        if not self._tools:
            raise DeviceOfflineError("Not connected to device")
        
        logger.debug(f"Typing text: {text[:50]}...")
        await self._tools.send_keys(text)
    
    @map_error
    async def swipe(
        self,
        start_x: float,
        start_y: float,
        end_x: float,
        end_y: float,
        duration_ms: int = 300,
    ) -> None:
        """
        Swipe gesture.
        
        Args:
            start_x: Start X [0.0, 1.0]
            start_y: Start Y [0.0, 1.0]
            end_x: End X [0.0, 1.0]
            end_y: End Y [0.0, 1.0]
            duration_ms: Swipe duration in milliseconds
        
        Raises:
            DeviceOfflineError: Device unreachable
            ActionTimeoutError: Operation timeout
        """
        self._validate_coordinates(start_x, start_y)
        self._validate_coordinates(end_x, end_y)
        
        if not self._tools:
            raise DeviceOfflineError("Not connected to device")
        
        screen_size = await self._get_screen_size()
        abs_start_x = int(start_x * screen_size[0])
        abs_start_y = int(start_y * screen_size[1])
        abs_end_x = int(end_x * screen_size[0])
        abs_end_y = int(end_y * screen_size[1])
        
        logger.debug(f"Swiping from ({start_x}, {start_y}) to ({end_x}, {end_y})")
        await self._tools.swipe(abs_start_x, abs_start_y, abs_end_x, abs_end_y, duration_ms)
    
    @map_error
    async def scroll(self, direction: str) -> None:
        """
        Scroll in direction.
        
        Args:
            direction: One of "up", "down", "left", "right"
        
        Raises:
            DeviceOfflineError: Device unreachable
            ActionFailedError: Invalid direction
        """
        if direction not in ["up", "down", "left", "right"]:
            raise ActionFailedError(f"Invalid scroll direction: {direction}")
        
        if not self._tools:
            raise DeviceOfflineError("Not connected to device")
        
        logger.debug(f"Scrolling {direction}")
        await self._tools.scroll(direction)
    
    @map_error
    async def press_back(self) -> None:
        """Navigate back."""
        if not self._tools:
            raise DeviceOfflineError("Not connected to device")
        
        logger.debug("Pressing back button")
        await self._tools.press_back()
    
    @map_error
    async def press_home(self) -> None:
        """Go to home screen."""
        if not self._tools:
            raise DeviceOfflineError("Not connected to device")
        
        logger.debug("Pressing home button")
        await self._tools.press_home()
    
    @map_error
    async def get_current_app(self) -> str:
        """
        Get foreground package/bundle ID.
        
        Returns:
            Package ID (Android) or bundle ID (iOS)
        
        Raises:
            DeviceOfflineError: Device unreachable
        """
        if not self._tools:
            raise DeviceOfflineError("Not connected to device")
        
        package_id = await self._tools.get_current_package()
        logger.debug(f"Current app: {package_id}")
        return package_id
    
    @map_error
    async def restart_app(self, package: str) -> None:
        """
        Force stop and relaunch app.
        
        Args:
            package: Package ID to restart
        
        Raises:
            DeviceOfflineError: Device unreachable
            ActionFailedError: Restart failed
        """
        if not self._tools:
            raise DeviceOfflineError("Not connected to device")
        
        logger.info(f"Restarting app: {package}")
        await self._tools.force_stop(package)
        await asyncio.sleep(0.5)  # Brief pause
        await self._tools.launch_app(package)
    
    @map_error
    async def get_page_source(self) -> str:
        """
        Capture UI hierarchy XML/JSON.
        
        Returns:
            XML (Android) or JSON (iOS) representation of UI hierarchy
        
        Raises:
            DeviceOfflineError: Device unreachable
        """
        if not self._tools:
            raise DeviceOfflineError("Not connected to device")
        
        source = await self._tools.get_page_source()
        logger.debug(f"Page source captured: {len(source)} bytes")
        return source
    
    @map_error
    async def get_screenshot(self) -> bytes:
        """
        Capture screenshot as PNG bytes.
        
        Returns:
            PNG image bytes
        
        Raises:
            DeviceOfflineError: Device unreachable
        """
        if not self._tools:
            raise DeviceOfflineError("Not connected to device")
        
        screenshot_bytes = await self._tools.get_screenshot_as_png()
        logger.debug(f"Screenshot captured: {len(screenshot_bytes)} bytes")
        return screenshot_bytes
    
    # Helper methods (private)
    
    def _validate_coordinates(self, x: float, y: float) -> None:
        """
        Validate coordinates are in [0.0, 1.0] range.
        
        Args:
            x: X coordinate
            y: Y coordinate
        
        Raises:
            ActionFailedError: Invalid coordinates
        """
        if not (0.0 <= x <= 1.0 and 0.0 <= y <= 1.0):
            raise ActionFailedError(
                f"Coordinates out of range: ({x}, {y}). Must be [0.0, 1.0]"
            )
    
    async def _get_screen_size(self) -> Tuple[int, int]:
        """
        Get screen dimensions.
        
        Returns:
            (width, height) in pixels
        """
        if not self._tools:
            raise DeviceOfflineError("Not connected to device")
        
        # Use existing tools to get screen size
        size = await self._tools.get_window_size()
        return (size["width"], size["height"])

