"""
Appium Adapter Test Configuration (Scoped)

This conftest.py is scoped to adapters/appium/tests only.
It provides fixtures for testing Appium integration.

SCOPE:
------
- Integration tests for AppiumAdapter
- Uses real Appium server (Testcontainers or local)
- Tests SDK error mapping and retries

FIXTURES:
---------
- appium_server: Appium server URL
- appium_capabilities: Device capabilities
- appium_adapter: AppiumAdapter instance

TODO:
-----
- [ ] Add Testcontainers support
- [ ] Add mock Appium responses
- [ ] Add device state fixtures
"""

import pytest

# TODO: Add Testcontainers when available
# from testcontainers.compose import DockerCompose


@pytest.fixture(scope="session")
def appium_server():
    """
    Provide Appium server URL.
    
    TODO:
    - [ ] Use Testcontainers to spin up Appium
    - [ ] Fall back to localhost if Testcontainers unavailable
    """
    return "http://localhost:4723"


@pytest.fixture
def appium_capabilities():
    """Device capabilities for testing."""
    return {
        "platformName": "Android",
        "platformVersion": "11.0",
        "deviceName": "emulator-5554",
        "automationName": "UiAutomator2",
        "app": "/path/to/test.apk",
    }


@pytest.fixture
def appium_adapter(appium_server, appium_capabilities):
    """
    AppiumAdapter instance for integration tests.
    
    TODO: Implement when AppiumAdapter is ready
    """
    # from adapters.appium import AppiumAdapter
    # return AppiumAdapter(url=appium_server, capabilities=appium_capabilities)
    pass

