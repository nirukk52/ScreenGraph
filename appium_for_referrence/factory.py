"""
AppiumTools Factory

This module provides factory functions to create AppiumTools instances
for different platforms and configurations.
"""

from typing import List, Optional, Dict, Any
from .types import ToolExecutionContext, DriverConfig
from .interfaces.appium_tools import AppiumTools
from .implementations.android_appium_tools import AndroidAppiumTools
from .implementations.ios_appium_tools import IOSAppiumTools
from .config import (
    APPIUM_DEFAULT_SERVER_URL,
    ANDROID_DEFAULT_AUTOMATION_NAME,
    ANDROID_DEFAULT_CAPABILITIES,
    IOS_DEFAULT_AUTOMATION_NAME,
    IOS_DEFAULT_CAPABILITIES,
    PLATFORM_ANDROID,
    PLATFORM_IOS,
    SUPPORTED_PLATFORMS,
    DEFAULT_COMMAND_TIMEOUT,
    DEFAULT_NEW_COMMAND_TIMEOUT,
    DEFAULT_IMPLICIT_WAIT
)


def create_appium_tools(platform: str, driver_config: DriverConfig, execution_context: ToolExecutionContext) -> AppiumTools:
    """
    Create AppiumTools instance for the specified platform.
    
    Args:
        platform: Target platform ('android' or 'ios')
        driver_config: Driver configuration
        execution_context: Execution context for the tools
        
    Returns:
        AppiumTools instance for the specified platform
        
    Raises:
        ValueError: If platform is not supported
    """
    if platform.lower() == PLATFORM_ANDROID:
        tools = AndroidAppiumTools()
    elif platform.lower() == PLATFORM_IOS:
        tools = IOSAppiumTools()
    else:
        raise ValueError(f"Unsupported platform: {platform}. Supported platforms: {SUPPORTED_PLATFORMS}")
    
    # Initialize the tools with the execution context
    import asyncio
    asyncio.create_task(tools.initialize(execution_context))
    
    return tools


def create_android_tools(driver_config: DriverConfig, execution_context: ToolExecutionContext) -> AndroidAppiumTools:
    """
    Create Android AppiumTools instance.
    
    Args:
        driver_config: Driver configuration
        execution_context: Execution context for the tools
        
    Returns:
        AndroidAppiumTools instance
    """
    tools = AndroidAppiumTools()
    import asyncio
    asyncio.create_task(tools.initialize(execution_context))
    return tools


def create_ios_tools(driver_config: DriverConfig, execution_context: ToolExecutionContext) -> IOSAppiumTools:
    """
    Create iOS AppiumTools instance.
    
    Args:
        driver_config: Driver configuration
        execution_context: Execution context for the tools
        
    Returns:
        IOSAppiumTools instance
    """
    tools = IOSAppiumTools()
    import asyncio
    asyncio.create_task(tools.initialize(execution_context))
    return tools


def create_driver_config(
    platform: str,
    device_name: str,
    platform_version: str,
    server_url: str = APPIUM_DEFAULT_SERVER_URL,
    app_package: Optional[str] = None,
    app_activity: Optional[str] = None,
    bundle_id: Optional[str] = None,
    automation_name: Optional[str] = None,
    udid: Optional[str] = None,
    command_timeout: int = DEFAULT_COMMAND_TIMEOUT,
    new_command_timeout: int = DEFAULT_NEW_COMMAND_TIMEOUT,
    implicit_wait: int = DEFAULT_IMPLICIT_WAIT,
    **additional_capabilities
) -> DriverConfig:
    """
    Create a DriverConfig with common capabilities.
    
    Args:
        platform: Target platform ('android' or 'ios')
        device_name: Device name or UDID
        platform_version: Platform version
        server_url: Appium server URL (defaults to localhost:4723)
        app_package: Android package name (for Android)
        app_activity: Android activity name (for Android)
        bundle_id: iOS bundle identifier (for iOS)
        automation_name: Automation name (e.g., 'UiAutomator2', 'XCUITest')
        udid: Device UDID
        command_timeout: Command timeout in seconds
        new_command_timeout: New command timeout in seconds
        implicit_wait: Implicit wait timeout in seconds
        **additional_capabilities: Additional capabilities
        
    Returns:
        DriverConfig instance
    """
    # Start with platform-specific defaults
    if platform.lower() == PLATFORM_ANDROID:
        capabilities = {**ANDROID_DEFAULT_CAPABILITIES}
        if automation_name:
            capabilities['automationName'] = automation_name
        else:
            capabilities['automationName'] = ANDROID_DEFAULT_AUTOMATION_NAME
        
        if app_package:
            capabilities['appPackage'] = app_package
        if app_activity:
            capabilities['appActivity'] = app_activity
            
    elif platform.lower() == PLATFORM_IOS:
        capabilities = {**IOS_DEFAULT_CAPABILITIES}
        if automation_name:
            capabilities['automationName'] = automation_name
        else:
            capabilities['automationName'] = IOS_DEFAULT_AUTOMATION_NAME
        
        if bundle_id:
            capabilities['bundleId'] = bundle_id
    else:
        capabilities = {}
    
    # Add common capabilities
    capabilities.update({
        'platformName': platform,
        'deviceName': device_name,
        'platformVersion': platform_version,
        **additional_capabilities
    })
    
    if udid:
        capabilities['udid'] = udid
    
    return DriverConfig(
        platform_name=platform,
        platform_version=platform_version,
        device_name=device_name,
        app_package=app_package,
        app_activity=app_activity,
        bundle_id=bundle_id,
        automation_name=capabilities.get('automationName'),
        udid=udid,
        capabilities=capabilities,
        server_url=server_url,
        command_timeout=command_timeout,
        new_command_timeout=new_command_timeout,
        implicit_wait=implicit_wait
    )


def create_execution_context(
    run_id: str,
    session_id: str,
    platform: str,
    device_id: str
) -> ToolExecutionContext:
    """
    Create a ToolExecutionContext.
    
    Args:
        run_id: Run identifier
        session_id: Session identifier
        platform: Target platform
        device_id: Device identifier
        
    Returns:
        ToolExecutionContext instance
    """
    from datetime import datetime
    
    return ToolExecutionContext(
        run_id=run_id,
        session_id=session_id,
        platform=platform,
        device_id=device_id,
        timestamp=datetime.now()
    )


def get_supported_platforms() -> List[str]:
    """
    Get list of supported platforms.
    
    Returns:
        List of supported platform names
    """
    return list(SUPPORTED_PLATFORMS)


def validate_platform(platform: str) -> bool:
    """
    Validate if platform is supported.
    
    Args:
        platform: Platform name to validate
        
    Returns:
        True if platform is supported, False otherwise
    """
    return platform.lower() in SUPPORTED_PLATFORMS
