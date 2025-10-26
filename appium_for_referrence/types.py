"""
Core types and enums for AppiumTools system.

This module defines all the shared types, enums, and data classes
used across the AppiumTools interfaces and implementations.
"""

from enum import Enum
from typing import List, Optional, Dict, Any, Union, Tuple
from dataclasses import dataclass
from datetime import datetime


class ToolCategory(Enum):
    """Categories for organizing tools by functionality."""
    CONNECTION = "connection"
    DATA_GATHERING = "data_gathering"
    ELEMENT_ACTIONS = "element_actions"
    DEVICE_MANAGEMENT = "device_management"
    APP_MANAGEMENT = "app_management"
    NAVIGATION = "navigation"
    UTILITIES = "utilities"


class SelectorType(Enum):
    """Types of element selectors supported by Appium."""
    ID = "id"
    XPATH = "xpath"
    CLASS_NAME = "class_name"
    TAG_NAME = "tag_name"
    CSS_SELECTOR = "css_selector"
    ACCESSIBILITY_ID = "accessibility_id"
    ANDROID_UIAUTOMATOR = "android_uiautomator"
    IOS_PREDICATE = "ios_predicate"
    IOS_CLASS_CHAIN = "ios_class_chain"
    NAME = "name"
    LINK_TEXT = "link_text"
    PARTIAL_LINK_TEXT = "partial_link_text"


class DeviceOrientation(Enum):
    """Device orientation options."""
    PORTRAIT = "portrait"
    LANDSCAPE = "landscape"
    PORTRAIT_UPSIDE_DOWN = "portrait_upside_down"
    LANDSCAPE_LEFT = "landscape_left"
    LANDSCAPE_RIGHT = "landscape_right"


class SwipeDirection(Enum):
    """Directions for swipe gestures."""
    UP = "up"
    DOWN = "down"
    LEFT = "left"
    RIGHT = "right"


class ScrollDirection(Enum):
    """Directions for scroll gestures."""
    UP = "up"
    DOWN = "down"
    LEFT = "left"
    RIGHT = "right"


class TouchGesture(Enum):
    """Types of touch gestures."""
    TAP = "tap"
    LONG_PRESS = "long_press"
    DOUBLE_TAP = "double_tap"
    SWIPE = "swipe"
    SCROLL = "scroll"
    DRAG = "drag"
    PINCH = "pinch"
    ROTATE = "rotate"


class SystemPermission(Enum):
    """Common system permissions for mobile devices."""
    CAMERA = "camera"
    MICROPHONE = "microphone"
    LOCATION = "location"
    STORAGE = "storage"
    CONTACTS = "contacts"
    CALENDAR = "calendar"
    PHONE = "phone"
    SMS = "sms"
    NOTIFICATIONS = "notifications"
    BLUETOOTH = "bluetooth"
    WIFI = "wifi"
    INTERNET = "internet"
    ACCESS_FINE_LOCATION = "access_fine_location"
    ACCESS_COARSE_LOCATION = "access_coarse_location"
    READ_EXTERNAL_STORAGE = "read_external_storage"
    WRITE_EXTERNAL_STORAGE = "write_external_storage"
    RECORD_AUDIO = "record_audio"
    READ_CONTACTS = "read_contacts"
    WRITE_CONTACTS = "write_contacts"
    READ_CALENDAR = "read_calendar"
    WRITE_CALENDAR = "write_calendar"
    READ_PHONE_STATE = "read_phone_state"
    CALL_PHONE = "call_phone"
    READ_SMS = "read_sms"
    SEND_SMS = "send_sms"
    RECEIVE_SMS = "receive_sms"
    READ_LOGS = "read_logs"
    WRITE_SETTINGS = "write_settings"
    SYSTEM_ALERT_WINDOW = "system_alert_window"
    BIND_ACCESSIBILITY_SERVICE = "bind_accessibility_service"
    BIND_NOTIFICATION_LISTENER_SERVICE = "bind_notification_listener_service"


class SettingsPage(Enum):
    """Common settings pages on mobile devices."""
    MAIN_SETTINGS = "main_settings"
    WIFI_SETTINGS = "wifi_settings"
    BLUETOOTH_SETTINGS = "bluetooth_settings"
    LOCATION_SETTINGS = "location_settings"
    PRIVACY_SETTINGS = "privacy_settings"
    SECURITY_SETTINGS = "security_settings"
    DISPLAY_SETTINGS = "display_settings"
    SOUND_SETTINGS = "sound_settings"
    NOTIFICATION_SETTINGS = "notification_settings"
    APP_SETTINGS = "app_settings"
    DEVELOPER_OPTIONS = "developer_options"
    ACCESSIBILITY_SETTINGS = "accessibility_settings"
    LANGUAGE_SETTINGS = "language_settings"
    DATE_TIME_SETTINGS = "date_time_settings"
    BACKUP_SETTINGS = "backup_settings"
    STORAGE_SETTINGS = "storage_settings"
    BATTERY_SETTINGS = "battery_settings"
    ACCOUNT_SETTINGS = "account_settings"


@dataclass
class ToolResult:
    """Standard result wrapper for all tool operations."""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


@dataclass
class ToolMetadata:
    """Metadata for tool registration and discovery."""
    name: str
    description: str
    category: ToolCategory
    platform: List[str]
    requiresDriver: bool = True
    timeout: int = 5000
    retryable: bool = True
    parameters: Optional[Dict[str, Any]] = None
    returns: Optional[str] = None
    examples: Optional[List[str]] = None


@dataclass
class Bounds:
    """Element bounds information."""
    x: int
    y: int
    width: int
    height: int

    def center(self) -> Tuple[int, int]:
        """Get center coordinates of the bounds."""
        return (self.x + self.width // 2, self.y + self.height // 2)

    def to_dict(self) -> Dict[str, int]:
        """Convert to dictionary."""
        return {
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height
        }


@dataclass
class DriverConfig:
    """Configuration for Appium driver."""
    platform_name: str
    platform_version: Optional[str] = None
    device_name: Optional[str] = None
    app_package: Optional[str] = None
    app_activity: Optional[str] = None
    bundle_id: Optional[str] = None
    automation_name: Optional[str] = None
    udid: Optional[str] = None
    capabilities: Optional[Dict[str, Any]] = None
    server_url: str = "http://localhost:4723"
    command_timeout: int = 60
    new_command_timeout: int = 60
    implicit_wait: int = 10


@dataclass
class DriverSessionInfo:
    """Information about the current driver session."""
    session_id: str
    platform: str
    device_name: str
    platform_version: str
    automation_name: str
    capabilities: Dict[str, Any]
    created_at: datetime
    last_activity: Optional[datetime] = None


@dataclass
class ToolExecutionContext:
    """Context information for tool execution."""
    session_id: str
    test_id: Optional[str] = None
    user_id: Optional[str] = None
    environment: str = "test"
    config: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class ElementInfo:
    """Information about a UI element."""
    element_id: str
    tag_name: str
    text: Optional[str] = None
    content_description: Optional[str] = None
    resource_id: Optional[str] = None
    class_name: Optional[str] = None
    bounds: Optional[Bounds] = None
    enabled: bool = True
    displayed: bool = True
    selected: bool = False
    attributes: Optional[Dict[str, Any]] = None


@dataclass
class AppStateInfo:
    """Information about app state."""
    package_name: str
    activity_name: Optional[str] = None
    is_running: bool = False
    is_foreground: bool = False
    pid: Optional[int] = None
    memory_usage: Optional[int] = None
    cpu_usage: Optional[float] = None


@dataclass
class NetworkInfo:
    """Network connectivity information."""
    connected: bool
    wifi_connected: bool
    mobile_connected: bool
    wifi_ssid: Optional[str] = None
    mobile_operator: Optional[str] = None
    signal_strength: Optional[int] = None
    ip_address: Optional[str] = None


@dataclass
class MemoryInfo:
    """Device memory information."""
    total_memory: int
    available_memory: int
    used_memory: int
    memory_usage_percentage: float
    low_memory_warning: bool = False


@dataclass
class StorageInfo:
    """Device storage information."""
    total_storage: int
    available_storage: int
    used_storage: int
    storage_usage_percentage: float
    low_storage_warning: bool = False


@dataclass
class AppVersionInfo:
    """App version information."""
    version_name: str
    package_name: str
    version_code: Optional[str] = None
    min_sdk_version: Optional[int] = None
    target_sdk_version: Optional[int] = None
    install_date: Optional[datetime] = None
    last_update_date: Optional[datetime] = None


@dataclass
class AppInfo:
    """Comprehensive app information."""
    package_name: str
    app_name: str
    version_info: AppVersionInfo
    is_installed: bool = False
    is_running: bool = False
    is_system_app: bool = False
    install_size: Optional[int] = None
    data_size: Optional[int] = None
    cache_size: Optional[int] = None
    permissions: Optional[List[str]] = None
    activities: Optional[List[str]] = None
    services: Optional[List[str]] = None
    receivers: Optional[List[str]] = None
    providers: Optional[List[str]] = None


@dataclass
class DeepLinkInfo:
    """Deep link information."""
    scheme: str
    host: Optional[str] = None
    path: Optional[str] = None
    query_params: Optional[Dict[str, str]] = None
    fragment: Optional[str] = None
    full_url: str = ""
    is_valid: bool = True
    error_message: Optional[str] = None


@dataclass
class NotificationInfo:
    """Notification information."""
    notification_id: str
    title: str
    text: str
    package_name: str
    timestamp: datetime
    is_ongoing: bool = False
    is_clearable: bool = True
    priority: Optional[int] = None
    category: Optional[str] = None
    actions: Optional[List[str]] = None


@dataclass
class AppLaunchConfig:
    """Configuration for app launch."""
    package_name: str
    activity_name: Optional[str] = None
    bundle_id: Optional[str] = None
    wait_for_launch: bool = True
    launch_timeout: int = 30
    stop_app: bool = True
    clear_data: bool = False
    intent_flags: Optional[List[str]] = None
    environment_variables: Optional[Dict[str, str]] = None
    arguments: Optional[Dict[str, Any]] = None


@dataclass
class AutomationContext:
    """Automation context information."""
    name: str
    description: Optional[str] = None
    is_active: bool = False
    capabilities: Optional[Dict[str, Any]] = None


@dataclass
class PlatformInfo:
    """Platform information."""
    platform_name: str
    platform_version: str
    device_name: str
    automation_name: str
    udid: Optional[str] = None
    capabilities: Optional[Dict[str, Any]] = None


@dataclass
class ScreenSize:
    """Screen size information."""
    width: int
    height: int
    density: Optional[float] = None
    scale_factor: Optional[float] = None


@dataclass
class LogEntry:
    """Log entry information."""
    level: str
    message: str
    timestamp: datetime
    source: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class ToolLogEntry:
    """Tool-specific log entry."""
    tool_name: str
    operation: str
    level: str
    message: str
    timestamp: datetime
    duration_ms: Optional[int] = None
    success: Optional[bool] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class ToolHealthStatus:
    """Tool health status information."""
    is_healthy: bool
    last_check: datetime
    error_count: int = 0
    warning_count: int = 0
    uptime_seconds: int = 0
    memory_usage_mb: Optional[float] = None
    cpu_usage_percent: Optional[float] = None
    issues: Optional[List[str]] = None


@dataclass
class ToolUsageStats:
    """Tool usage statistics."""
    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    total_duration_ms: int = 0
    average_duration_ms: float = 0.0
    last_used: Optional[datetime] = None
    most_used_tool: Optional[str] = None
    error_rate: float = 0.0


@dataclass
class BatchOperationResult:
    """Result of batch operations."""
    total_operations: int
    successful_operations: int
    failed_operations: int
    results: List[ToolResult]
    total_duration_ms: int
    errors: Optional[List[str]] = None


# Type aliases for common use cases
ElementList = List[ElementInfo]
AppList = List[AppInfo]
NotificationList = List[NotificationInfo]
PermissionList = List[SystemPermission]
