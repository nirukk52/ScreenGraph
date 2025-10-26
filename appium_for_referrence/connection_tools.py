from __future__ import annotations
"""
Connection Tools Interface

Handles all connection-related operations for Appium drivers.
This includes driver initialization, context switching, and connection management.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime

from ..types import ToolResult, AutomationContext


class ConnectionTools(ABC):
    """Abstract base class for connection-related tools."""
    
    @abstractmethod
    async def connect(self, config: 'DriverConfig') -> ToolResult[bool]:
        """
        Initialize the Appium driver connection
        
        Args:
            config: Driver configuration options
            
        Returns:
            Success status of connection initialization
        """
        pass
    
    @abstractmethod
    async def disconnect(self) -> ToolResult[bool]:
        """
        Disconnect from the Appium driver
        
        Returns:
            Success status of disconnection
        """
        pass
    
    @abstractmethod
    async def is_connected(self) -> ToolResult[bool]:
        """
        Check if the driver is currently connected
        
        Returns:
            Connection status
        """
        pass
    
    @abstractmethod
    async def set_implicit_wait(self, milliseconds: int) -> ToolResult[bool]:
        """
        Set implicit element wait timeout for queries like findElement(s)
        
        Args:
            milliseconds: Timeout in milliseconds
            
        Returns:
            Success status of timeout setting
        """
        pass
    
    @abstractmethod
    async def get_contexts(self) -> ToolResult[List[AutomationContext]]:
        """
        List available automation contexts (e.g., ["NATIVE_APP", "WEBVIEW_chrome"])
        
        Returns:
            List of available contexts
        """
        pass
    
    @abstractmethod
    async def set_context(self, context_name: str) -> ToolResult[bool]:
        """
        Switch current automation context by name (no-op if not supported)
        
        Args:
            context_name: Name of the context to switch to
            
        Returns:
            Success status of context switch
        """
        pass
    
    @abstractmethod
    async def get_current_context(self) -> ToolResult[Optional[AutomationContext]]:
        """
        Get current automation context
        
        Returns:
            Current context information
        """
        pass
    
    @abstractmethod
    async def reset_session(self) -> ToolResult[bool]:
        """
        Reset the driver session (useful for recovery)
        
        Returns:
            Success status of session reset
        """
        pass
    
    @abstractmethod
    async def get_session_info(self) -> ToolResult['DriverSessionInfo']:
        """
        Get driver session information
        
        Returns:
            Session details
        """
        pass


@dataclass
class DriverConfig:
    """Configuration for Appium driver connection."""
    server_url: str
    capabilities: Dict[str, Any]
    timeout: Optional[int] = None
    retry_count: Optional[int] = None
    platform: str = 'android'


@dataclass
class DriverSessionInfo:
    """Information about the current driver session."""
    session_id: str
    platform: str
    capabilities: Dict[str, Any]
    server_url: str
    connected_at: datetime
    last_activity: datetime
