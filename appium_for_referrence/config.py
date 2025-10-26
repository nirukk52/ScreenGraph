"""
Configuration constants for AppiumTools system.

This module defines all configuration constants, default values, and settings
used across the AppiumTools implementation.
"""

from typing import Dict, Any

# Appium Server Configuration
APPIUM_DEFAULT_SERVER_URL = "http://localhost:4723"
APPIUM_DEFAULT_SERVER_HOST = "localhost"
APPIUM_DEFAULT_SERVER_PORT = 4723

# Timeout Configuration (in seconds)
DEFAULT_IMPLICIT_WAIT = 10
DEFAULT_COMMAND_TIMEOUT = 60
DEFAULT_NEW_COMMAND_TIMEOUT = 60
DEFAULT_SCREENSHOT_TIMEOUT = 10
DEFAULT_PAGE_SOURCE_TIMEOUT = 10
DEFAULT_ELEMENT_WAIT_TIMEOUT = 30
DEFAULT_CONNECTION_TIMEOUT = 30
DEFAULT_APP_LAUNCH_TIMEOUT = 15
DEFAULT_APP_INSTALL_TIMEOUT = 60

# Timeout Configuration (in milliseconds) for tool metadata
TIMEOUT_CONNECTION = 30000
TIMEOUT_DISCONNECT = 5000
TIMEOUT_SET_IMPLICIT_WAIT = 1000
TIMEOUT_GET_CONTEXTS = 5000
TIMEOUT_SET_CONTEXT = 5000
TIMEOUT_SCREENSHOT = 10000
TIMEOUT_GET_PAGE_SOURCE = 10000
TIMEOUT_GET_BOUNDS = 5000
TIMEOUT_GET_ELEMENTS = 5000
TIMEOUT_EXISTS = 3000
TIMEOUT_WAIT_FOR = 30000
TIMEOUT_FIND_TEXT = 5000
TIMEOUT_GET_PLATFORM_INFO = 5000
TIMEOUT_GET_SCREEN_SIZE = 3000
TIMEOUT_TAP = 5000
TIMEOUT_TAP_COORDINATES = 3000
TIMEOUT_LONG_PRESS = 5000
TIMEOUT_TYPE_TEXT = 5000
TIMEOUT_CLEAR_TEXT = 3000
TIMEOUT_SWIPE = 5000
TIMEOUT_SCROLL = 5000
TIMEOUT_SCROLL_TO_ELEMENT = 15000
TIMEOUT_DOUBLE_TAP = 5000
TIMEOUT_DRAG_DROP = 10000
TIMEOUT_HIDE_KEYBOARD = 3000
TIMEOUT_SET_ORIENTATION = 5000
TIMEOUT_LOCK_SCREEN = 3000
TIMEOUT_UNLOCK_SCREEN = 5000
TIMEOUT_SET_CLIPBOARD = 3000
TIMEOUT_GET_CLIPBOARD = 3000
TIMEOUT_PRESS_BUTTON = 2000
TIMEOUT_INSTALL_APP = 60000
TIMEOUT_UNINSTALL_APP = 30000
TIMEOUT_LAUNCH_APP = 15000
TIMEOUT_CLOSE_APP = 5000
TIMEOUT_TERMINATE_APP = 5000
TIMEOUT_RESET_APP = 10000
TIMEOUT_BACKGROUND_APP = 5000
TIMEOUT_IS_APP_INSTALLED = 5000
TIMEOUT_IS_APP_RUNNING = 3000
TIMEOUT_GET_APP_INFO = 5000
TIMEOUT_OPEN_DEEP_LINK = 10000
TIMEOUT_PARSE_DEEP_LINK = 1000
TIMEOUT_NAVIGATION = 3000
TIMEOUT_NOTIFICATIONS = 5000
TIMEOUT_INITIALIZE = 5000
TIMEOUT_CLEANUP = 10000
TIMEOUT_UTILITY = 1000

# Retry Configuration
DEFAULT_MAX_RETRIES = 3
DEFAULT_RETRY_DELAY = 1  # seconds
RETRYABLE_OPERATIONS = [
    'connect', 'screenshot', 'get_page_source', 'tap', 'type_text',
    'swipe', 'scroll', 'install_app', 'launch_app', 'get_contexts'
]

# Android Configuration
ANDROID_DEFAULT_AUTOMATION_NAME = "UiAutomator2"
ANDROID_MIN_PLATFORM_VERSION = "5.0"
ANDROID_DEFAULT_APP_WAIT_ACTIVITY = "*"
ANDROID_DEFAULT_APP_WAIT_PACKAGE = None

# Android Capabilities
ANDROID_DEFAULT_CAPABILITIES: Dict[str, Any] = {
    "platformName": "Android",
    "automationName": "UiAutomator2",
    "noReset": True,
    "fullReset": False,
    "autoGrantPermissions": True,
    "ignoreHiddenApiPolicyError": True,
    "disableWindowAnimation": True,
    "skipDeviceInitialization": False,
    "skipServerInstallation": False,
}

# iOS Configuration
IOS_DEFAULT_AUTOMATION_NAME = "XCUITest"
IOS_MIN_PLATFORM_VERSION = "12.0"
IOS_DEFAULT_SHOW_IOS_LOG = True
IOS_DEFAULT_START_IWDP = True

# iOS Capabilities
IOS_DEFAULT_CAPABILITIES: Dict[str, Any] = {
    "platformName": "iOS",
    "automationName": "XCUITest",
    "noReset": True,
    "fullReset": False,
    "autoAcceptAlerts": False,
    "autoDismissAlerts": False,
    "showIOSLog": True,
    "startIWDP": True,
}

# Element Selector Configuration
DEFAULT_SELECTOR_TIMEOUT = 10  # seconds
SELECTOR_RETRY_INTERVAL = 0.5  # seconds

# Gesture Configuration
DEFAULT_SWIPE_DURATION = 1000  # milliseconds
DEFAULT_SCROLL_DURATION = 1000  # milliseconds
DEFAULT_LONG_PRESS_DURATION = 1000  # milliseconds
DEFAULT_TAP_DURATION = 100  # milliseconds
DEFAULT_DOUBLE_TAP_INTERVAL = 100  # milliseconds

# Screenshot Configuration
SCREENSHOT_DEFAULT_FORMAT = "png"
SCREENSHOT_DEFAULT_QUALITY = 90
SCREENSHOT_MAX_WIDTH = 1920
SCREENSHOT_MAX_HEIGHT = 1080

# Logging Configuration
LOG_LEVEL_DEFAULT = "INFO"
LOG_MAX_ENTRIES = 1000
LOG_RETENTION_HOURS = 24

# Health Check Configuration
HEALTH_CHECK_INTERVAL = 60  # seconds
HEALTH_CHECK_TIMEOUT = 5  # seconds
HEALTH_WARNING_THRESHOLD_ERRORS = 10
HEALTH_CRITICAL_THRESHOLD_ERRORS = 50

# Performance Configuration
MAX_CONCURRENT_OPERATIONS = 5
MAX_BATCH_SIZE = 10
OPERATION_QUEUE_SIZE = 100

# Deep Link Configuration
DEEP_LINK_TIMEOUT = 5  # seconds
DEEP_LINK_SUPPORTED_SCHEMES = ['http', 'https', 'app', 'myapp']

# App Management Configuration
APP_LAUNCH_RETRY_COUNT = 3
APP_LAUNCH_RETRY_DELAY = 2  # seconds
APP_BACKGROUND_DURATION = -1  # -1 means indefinitely

# Device Management Configuration
SCREEN_ROTATION_TIMEOUT = 5  # seconds
CLIPBOARD_MAX_LENGTH = 10000  # characters
PERMISSION_DIALOG_TIMEOUT = 5  # seconds

# Navigation Configuration
BACK_BUTTON_WAIT = 1  # seconds
HOME_BUTTON_WAIT = 1  # seconds
RECENT_APPS_WAIT = 2  # seconds
NOTIFICATION_PANEL_WAIT = 1  # seconds

# Error Messages
ERROR_DRIVER_NOT_INITIALIZED = "Driver not initialized. Call connect() first."
ERROR_ELEMENT_NOT_FOUND = "Element not found: {}"
ERROR_TIMEOUT = "Operation timed out after {} seconds"
ERROR_INVALID_SELECTOR = "Invalid selector type: {}"
ERROR_PLATFORM_NOT_SUPPORTED = "Platform not supported: {}"
ERROR_APP_NOT_INSTALLED = "App not installed: {}"
ERROR_APP_NOT_RUNNING = "App not running: {}"
ERROR_INVALID_ORIENTATION = "Invalid orientation: {}"
ERROR_INVALID_PERMISSION = "Invalid permission: {}"
ERROR_CONNECTION_FAILED = "Failed to connect to device: {}"
ERROR_DEEP_LINK_INVALID = "Invalid deep link URL: {}"

# Success Messages
SUCCESS_CONNECTED = "Successfully connected to device"
SUCCESS_DISCONNECTED = "Successfully disconnected from device"
SUCCESS_SCREENSHOT = "Screenshot captured successfully"
SUCCESS_ELEMENT_FOUND = "Element found: {}"
SUCCESS_TAP = "Tap performed successfully"
SUCCESS_TYPE = "Text typed successfully"
SUCCESS_SWIPE = "Swipe performed successfully"
SUCCESS_SCROLL = "Scroll performed successfully"
SUCCESS_APP_INSTALLED = "App installed successfully"
SUCCESS_APP_LAUNCHED = "App launched successfully"
SUCCESS_APP_CLOSED = "App closed successfully"

# Platform Identifiers
PLATFORM_ANDROID = "android"
PLATFORM_IOS = "ios"
SUPPORTED_PLATFORMS = [PLATFORM_ANDROID, PLATFORM_IOS]

# Tool Categories
CATEGORY_CONNECTION = "connection"
CATEGORY_DATA_GATHERING = "data_gathering"
CATEGORY_ELEMENT_ACTIONS = "element_actions"
CATEGORY_DEVICE_MANAGEMENT = "device_management"
CATEGORY_APP_MANAGEMENT = "app_management"
CATEGORY_NAVIGATION = "navigation"
CATEGORY_UTILITIES = "utilities"

# Environment Configuration
ENV_DEVELOPMENT = "development"
ENV_TESTING = "testing"
ENV_STAGING = "staging"
ENV_PRODUCTION = "production"

# Feature Flags
FEATURE_ENABLE_LOGGING = True
FEATURE_ENABLE_HEALTH_CHECK = True
FEATURE_ENABLE_USAGE_STATS = True
FEATURE_ENABLE_RETRY = True
FEATURE_ENABLE_BATCH_OPERATIONS = True
FEATURE_ENABLE_SCREENSHOT_COMPRESSION = True

# API Configuration
API_VERSION = "v1"
API_BASE_PATH = "/api/v1"
API_TIMEOUT = 30  # seconds

# Tool Version
APPIUM_TOOLS_VERSION = "1.0.0"
APPIUM_MIN_VERSION = "2.0.0"
PYTHON_MIN_VERSION = "3.8"

# Session Configuration
SESSION_MAX_DURATION = 3600  # seconds (1 hour)
SESSION_IDLE_TIMEOUT = 300  # seconds (5 minutes)
SESSION_MAX_CONCURRENT = 10

# Cache Configuration
CACHE_ENABLED = True
CACHE_MAX_SIZE = 100  # entries
CACHE_TTL = 300  # seconds (5 minutes)

# WebDriver Configuration
WEBDRIVER_ACCEPT_SSL_CERTS = True
WEBDRIVER_NATIVE_WEB_SCREENSHOT = True
WEBDRIVER_PRINT_PAGE_SOURCE_ON_FIND_FAILURE = False

# Appium Settings
APPIUM_SETTINGS_WAIT_FOR_IDLE_TIMEOUT = 10  # seconds
APPIUM_SETTINGS_WAIT_FOR_SELECTOR_TIMEOUT = 0  # seconds (0 means no wait)
APPIUM_SETTINGS_NORMALIZE_TAG_NAMES = True
APPIUM_SETTINGS_ALLOW_INVISIBLE_ELEMENTS = False
APPIUM_SETTINGS_ENABLE_NOTIFICATION_LISTENER = True
APPIUM_SETTINGS_ACTION_ACKNOWLEDGMENT_TIMEOUT = 3  # seconds

# Export all constants
__all__ = [
    # Server Configuration
    'APPIUM_DEFAULT_SERVER_URL',
    'APPIUM_DEFAULT_SERVER_HOST',
    'APPIUM_DEFAULT_SERVER_PORT',
    
    # Timeout Configuration
    'DEFAULT_IMPLICIT_WAIT',
    'DEFAULT_COMMAND_TIMEOUT',
    'DEFAULT_NEW_COMMAND_TIMEOUT',
    
    # Platform Configuration
    'ANDROID_DEFAULT_AUTOMATION_NAME',
    'ANDROID_DEFAULT_CAPABILITIES',
    'IOS_DEFAULT_AUTOMATION_NAME',
    'IOS_DEFAULT_CAPABILITIES',
    
    # Platform Identifiers
    'PLATFORM_ANDROID',
    'PLATFORM_IOS',
    'SUPPORTED_PLATFORMS',
    
    # Error Messages
    'ERROR_DRIVER_NOT_INITIALIZED',
    'ERROR_ELEMENT_NOT_FOUND',
    'ERROR_TIMEOUT',
    
    # Success Messages
    'SUCCESS_CONNECTED',
    'SUCCESS_DISCONNECTED',
    
    # Version
    'APPIUM_TOOLS_VERSION',
]

