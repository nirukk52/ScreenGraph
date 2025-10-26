from __future__ import annotations
"""
Action Tools Interface

Handles all user interaction operations with mobile app elements.
This includes tapping, typing, swiping, scrolling, and other gestures.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from enum import Enum
from dataclasses import dataclass

from ..types import ToolResult, SelectorType


class ActionTools(ABC):
    """Abstract base class for action tools."""
    
    @abstractmethod
    async def tap_by_selector(self, selector_type: SelectorType, selector: str) -> ToolResult[bool]:
        """
        Tap the center of the first element matched by selector
        
        Args:
            selector_type: Type of selector to use
            selector: Selector value
            
        Returns:
            Success status of tap action
        """
        pass
    
    @abstractmethod
    async def tap_at_coordinates(self, x: int, y: int) -> ToolResult[bool]:
        """
        Tap at specific coordinates
        
        Args:
            x: X coordinate
            y: Y coordinate
            
        Returns:
            Success status of tap action
        """
        pass
    
    @abstractmethod
    async def tap_by_text(self, text: str) -> ToolResult[bool]:
        """
        Tap the first visible element whose text or content description contains the given text
        
        Args:
            text: Text to search for and tap
            
        Returns:
            Success status of tap action
        """
        pass
    
    @abstractmethod
    async def long_press_by_selector(self, selector_type: SelectorType, selector: str, duration: Optional[int] = None) -> ToolResult[bool]:
        """
        Long press on the first element matched by selector
        
        Args:
            selector_type: Type of selector to use
            selector: Selector value
            duration: Duration of long press in milliseconds
            
        Returns:
            Success status of long press action
        """
        pass
    
    @abstractmethod
    async def long_press_at_coordinates(self, x: int, y: int, duration: Optional[int] = None) -> ToolResult[bool]:
        """
        Long press at specific coordinates
        
        Args:
            x: X coordinate
            y: Y coordinate
            duration: Duration of long press in milliseconds
            
        Returns:
            Success status of long press action
        """
        pass
    
    @abstractmethod
    async def type_text(self, selector_type: SelectorType, selector: str, text: str, clear_first: bool = False) -> ToolResult[bool]:
        """
        Type text into the first element matched by selector
        
        Args:
            selector_type: Type of selector to use
            selector: Selector value
            text: Text to type
            clear_first: Whether to clear existing text first
            
        Returns:
            Success status of typing action
        """
        pass
    
    @abstractmethod
    async def type_text_at_focus(self, text: str, clear_first: bool = False) -> ToolResult[bool]:
        """
        Type text at current focus (no selector needed)
        
        Args:
            text: Text to type
            clear_first: Whether to clear existing text first
            
        Returns:
            Success status of typing action
        """
        pass
    
    @abstractmethod
    async def clear_text(self, selector_type: SelectorType, selector: str) -> ToolResult[bool]:
        """
        Clear text from the first element matched by selector
        
        Args:
            selector_type: Type of selector to use
            selector: Selector value
            
        Returns:
            Success status of clear action
        """
        pass
    
    @abstractmethod
    async def swipe(self, start_x: int, start_y: int, end_x: int, end_y: int, duration: Optional[int] = None) -> ToolResult[bool]:
        """
        Swipe from one point to another
        
        Args:
            start_x: Start X coordinate
            start_y: Start Y coordinate
            end_x: End X coordinate
            end_y: End Y coordinate
            duration: Duration of swipe in milliseconds
            
        Returns:
            Success status of swipe action
        """
        pass
    
    @abstractmethod
    async def swipe_direction(self, direction: 'SwipeDirection', distance: Optional[float] = None, duration: Optional[int] = None) -> ToolResult[bool]:
        """
        Swipe in a specific direction
        
        Args:
            direction: Direction to swipe
            distance: Distance to swipe (percentage of screen)
            duration: Duration of swipe in milliseconds
            
        Returns:
            Success status of swipe action
        """
        pass
    
    @abstractmethod
    async def scroll(self, direction: 'ScrollDirection', distance: Optional[float] = None, duration: Optional[int] = None) -> ToolResult[bool]:
        """
        Scroll in a specific direction
        
        Args:
            direction: Direction to scroll
            distance: Distance to scroll (percentage of screen)
            duration: Duration of scroll in milliseconds
            
        Returns:
            Success status of scroll action
        """
        pass
    
    @abstractmethod
    async def scroll_to_element(self, selector_type: SelectorType, selector: str, direction: Optional['ScrollDirection'] = None, max_scrolls: Optional[int] = None) -> ToolResult[bool]:
        """
        Scroll to find an element
        
        Args:
            selector_type: Type of selector to use
            selector: Selector value
            direction: Direction to scroll
            max_scrolls: Maximum number of scroll attempts
            
        Returns:
            Success status and element found
        """
        pass
    
    @abstractmethod
    async def pinch(self, scale: float, center_x: Optional[int] = None, center_y: Optional[int] = None) -> ToolResult[bool]:
        """
        Pinch to zoom in or out
        
        Args:
            scale: Scale factor (1.0 = no change, >1.0 = zoom in, <1.0 = zoom out)
            center_x: Center X coordinate for pinch
            center_y: Center Y coordinate for pinch
            
        Returns:
            Success status of pinch action
        """
        pass
    
    @abstractmethod
    async def double_tap(self, selector_type: SelectorType, selector: str) -> ToolResult[bool]:
        """
        Double tap on element
        
        Args:
            selector_type: Type of selector to use
            selector: Selector value
            
        Returns:
            Success status of double tap action
        """
        pass
    
    @abstractmethod
    async def double_tap_at_coordinates(self, x: int, y: int) -> ToolResult[bool]:
        """
        Double tap at coordinates
        
        Args:
            x: X coordinate
            y: Y coordinate
            
        Returns:
            Success status of double tap action
        """
        pass
    
    @abstractmethod
    async def drag_and_drop(self, from_selector_type: SelectorType, from_selector: str, to_selector_type: SelectorType, to_selector: str, duration: Optional[int] = None) -> ToolResult[bool]:
        """
        Drag and drop from one element to another
        
        Args:
            from_selector_type: Source element selector type
            from_selector: Source element selector
            to_selector_type: Target element selector type
            to_selector: Target element selector
            duration: Duration of drag in milliseconds
            
        Returns:
            Success status of drag and drop action
        """
        pass
    
    @abstractmethod
    async def press_and_hold(self, selector_type: SelectorType, selector: str, duration: int) -> ToolResult[bool]:
        """
        Press and hold on element
        
        Args:
            selector_type: Type of selector to use
            selector: Selector value
            duration: Duration to hold in milliseconds
            
        Returns:
            Success status of press and hold action
        """
        pass
    
    @abstractmethod
    async def multi_touch(self, gestures: List['TouchGesture']) -> ToolResult[bool]:
        """
        Perform multi-touch gesture
        
        Args:
            gestures: Array of touch gestures to perform simultaneously
            
        Returns:
            Success status of multi-touch action
        """
        pass
    
    @abstractmethod
    async def hide_keyboard(self) -> ToolResult[bool]:
        """
        Hide the virtual keyboard if visible
        
        Returns:
            Success status of keyboard hiding
        """
        pass
    
    @abstractmethod
    async def show_keyboard(self) -> ToolResult[bool]:
        """
        Show the virtual keyboard
        
        Returns:
            Success status of keyboard showing
        """
        pass
    
    @abstractmethod
    async def is_keyboard_visible(self) -> ToolResult[bool]:
        """
        Check if keyboard is currently visible
        
        Returns:
            Keyboard visibility status
        """
        pass


class SwipeDirection(Enum):
    """Swipe direction options."""
    UP = 'up'
    DOWN = 'down'
    LEFT = 'left'
    RIGHT = 'right'


class ScrollDirection(Enum):
    """Scroll direction options."""
    UP = 'up'
    DOWN = 'down'
    LEFT = 'left'
    RIGHT = 'right'


@dataclass
class TouchGesture:
    """A single touch gesture."""
    action: str  # 'press', 'move', 'release', 'wait'
    x: int
    y: int
    duration: Optional[int] = None
