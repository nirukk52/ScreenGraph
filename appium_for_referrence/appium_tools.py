from __future__ import annotations
"""
Main AppiumTools Interface

This is the primary interface that combines all tool categories.
It provides a unified interface for mobile app automation across platforms.
All implementations should extend this interface and provide platform-specific functionality.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any, Callable
from dataclasses import dataclass
from datetime import datetime

from ..types import ToolResult, ToolExecutionContext, BatchOperationResult, ToolMetadata, ToolCategory

from .connection_tools import ConnectionTools
from .data_gathering_tools import DataGatheringTools
from .action_tools import ActionTools
from .device_management_tools import DeviceManagementTools
from .app_management_tools import AppManagementTools
from .navigation_tools import NavigationTools


class AppiumTools(ConnectionTools, DataGatheringTools, ActionTools, DeviceManagementTools, AppManagementTools, NavigationTools):
    """
    Main AppiumTools interface combining all tool categories.
    
    This interface provides a unified API for mobile app automation
    across Android and iOS platforms, designed for integration with LangGraph.
    """
    
    @abstractmethod
    def get_platform(self) -> str:
        """
        Get the platform this tools implementation supports
        
        Returns:
            Platform identifier ('android' or 'ios')
        """
        pass
    
    @abstractmethod
    def get_tool_metadata(self) -> List[ToolMetadata]:
        """
        Get tool metadata for LangGraph integration
        
        Returns:
            Tool metadata information
        """
        pass
    
    @abstractmethod
    async def initialize(self, context: ToolExecutionContext) -> ToolResult[bool]:
        """
        Initialize the tools with execution context
        
        Args:
            context: Execution context for the tools
            
        Returns:
            Success status of initialization
        """
        pass
    
    @abstractmethod
    async def cleanup(self) -> ToolResult[bool]:
        """
        Cleanup resources and disconnect
        
        Returns:
            Success status of cleanup
        """
        pass
    
    @abstractmethod
    async def is_ready(self) -> ToolResult[bool]:
        """
        Check if tools are ready for use
        
        Returns:
            Ready status
        """
        pass
    
    @abstractmethod
    def get_execution_context(self) -> Optional[ToolExecutionContext]:
        """
        Get current execution context
        
        Returns:
            Current execution context
        """
        pass
    
    @abstractmethod
    async def update_execution_context(self, context: Dict[str, Any]) -> ToolResult[bool]:
        """
        Update execution context
        
        Args:
            context: New execution context data
            
        Returns:
            Success status of context update
        """
        pass
    
    @abstractmethod
    async def perform_batch(self, operations: List[Callable[[], ToolResult[Any]]]) -> ToolResult[BatchOperationResult]:
        """
        Perform batch operations to reduce chattiness
        
        Args:
            operations: Array of operations to perform
            
        Returns:
            Batch operation results
        """
        pass
    
    @abstractmethod
    async def get_health_status(self) -> ToolResult['ToolHealthStatus']:
        """
        Get tool health status
        
        Returns:
            Health status information
        """
        pass
    
    @abstractmethod
    async def reset(self) -> ToolResult[bool]:
        """
        Reset tools to initial state
        
        Returns:
            Success status of reset
        """
        pass
    
    @abstractmethod
    async def get_usage_stats(self) -> ToolResult['ToolUsageStats']:
        """
        Get tool usage statistics
        
        Returns:
            Usage statistics
        """
        pass
    
    @abstractmethod
    async def set_logging_enabled(self, enabled: bool) -> ToolResult[bool]:
        """
        Enable/disable tool logging
        
        Args:
            enabled: Whether to enable logging
            
        Returns:
            Success status of logging change
        """
        pass
    
    @abstractmethod
    async def get_logs(self, level: Optional[str] = None, limit: Optional[int] = None) -> ToolResult[List['ToolLogEntry']]:
        """
        Get tool logs
        
        Args:
            level: Log level filter
            limit: Maximum number of log entries
            
        Returns:
            Tool log entries
        """
        pass
    
    @abstractmethod
    async def clear_logs(self) -> ToolResult[bool]:
        """
        Clear tool logs
        
        Returns:
            Success status of log clearing
        """
        pass


@dataclass
class ToolHealthStatus:
    """Health status information for tools."""
    is_healthy: bool
    last_error: Optional[str] = None
    last_error_time: Optional[datetime] = None
    uptime: int = 0
    total_operations: int = 0
    successful_operations: int = 0
    failed_operations: int = 0
    average_response_time: float = 0.0
    memory_usage: int = 0
    platform: str = 'unknown'
    version: str = '1.0.0'


@dataclass
class ToolUsageStats:
    """Usage statistics for tools."""
    total_operations: int = 0
    successful_operations: int = 0
    failed_operations: int = 0
    average_response_time: float = 0.0
    operations_by_category: Dict[str, int] = None
    operations_by_tool: Dict[str, int] = None
    last_operation_time: Optional[datetime] = None
    uptime: int = 0
    memory_usage: int = 0
    error_rate: float = 0.0
    
    def __post_init__(self):
        if self.operations_by_category is None:
            self.operations_by_category = {}
        if self.operations_by_tool is None:
            self.operations_by_tool = {}


@dataclass
class ToolLogEntry:
    """A log entry from tools."""
    timestamp: datetime
    level: str  # 'debug', 'info', 'warn', 'error'
    message: str
    tool: str
    operation: str
    duration: Optional[float] = None
    success: bool = True
    error: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
