from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set, List, Any
import json
import logging
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Store active connections by conversation_id
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Store typing status by conversation_id and agent_id
        self.typing_status: Dict[str, Dict[str, bool]] = {}
        
    async def connect(self, websocket: WebSocket, conversation_id: str):
        """Accept a new WebSocket connection for a specific conversation"""
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = set()
        self.active_connections[conversation_id].add(websocket)
        logger.info(f"New WebSocket connection for conversation {conversation_id}")
        
        # Send the current typing status for this conversation
        if conversation_id in self.typing_status:
            for agent_id, is_typing in self.typing_status[conversation_id].items():
                await websocket.send_json({
                    "type": "typing_indicator",
                    "agent_id": agent_id,
                    "is_typing": is_typing
                })
        
    async def disconnect(self, websocket: WebSocket, conversation_id: str):
        """Remove a WebSocket connection when it's closed"""
        if conversation_id in self.active_connections:
            if websocket in self.active_connections[conversation_id]:
                self.active_connections[conversation_id].remove(websocket)
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]
                # Clean up typing status for this conversation
                if conversation_id in self.typing_status:
                    del self.typing_status[conversation_id]
            logger.info(f"Closed WebSocket connection for conversation {conversation_id}")
        
    async def send_agent_typing(self, conversation_id: str, agent_id: str, is_typing: bool):
        """Send typing indicator status for an agent"""
        if conversation_id not in self.typing_status:
            self.typing_status[conversation_id] = {}
        
        # Only send if status changed
        if conversation_id not in self.typing_status or \
           agent_id not in self.typing_status[conversation_id] or \
           self.typing_status[conversation_id].get(agent_id) != is_typing:
            
            self.typing_status[conversation_id][agent_id] = is_typing
            
            await self.broadcast_to_conversation(conversation_id, {
                "type": "typing_indicator",
                "agent_id": agent_id,
                "is_typing": is_typing
            })
            
            logger.debug(f"Agent {agent_id} {'started' if is_typing else 'stopped'} typing in conversation {conversation_id}")
        
    async def send_partial_response(self, conversation_id: str, agent_id: str, partial_response: str, message_id: str):
        """Send partial response as it's being generated"""
        message = {
            "type": "partial_response",
            "agent_id": agent_id,
            "content": partial_response,
            "message_id": message_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_conversation(conversation_id, message)
        
    async def send_agent_response(self, conversation_id: str, agent_id: str, response: str, message_id: str):
        """Send complete agent response"""
        message = {
            "type": "agent_response",
            "agent_id": agent_id,
            "content": response,
            "message_id": message_id,
            "timestamp": datetime.utcnow().isoformat(),
            "is_complete": True
        }
        await self.broadcast_to_conversation(conversation_id, message)
        logger.info(f"Sent complete response from agent {agent_id} in conversation {conversation_id}")
        
    async def send_error(self, conversation_id: str, agent_id: str, error_message: str):
        """Send error message for an agent"""
        message = {
            "type": "error",
            "agent_id": agent_id,
            "error": error_message,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_conversation(conversation_id, message)
        logger.error(f"Error from agent {agent_id} in conversation {conversation_id}: {error_message}")
        
    async def broadcast_to_conversation(self, conversation_id: str, message: dict):
        """Broadcast message to all connections in a conversation"""
        if conversation_id in self.active_connections:
            dead_connections = set()
            for connection in self.active_connections[conversation_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending WebSocket message: {str(e)}")
                    dead_connections.add(connection)
            
            # Clean up dead connections
            for dead in dead_connections:
                await self.disconnect(dead, conversation_id)

    async def broadcast_conversation_update(self, conversation_id: str, agents_data: List[Dict[str, Any]]):
        """Broadcast when conversation has a new message or update"""
        message = {
            "type": "conversation_update",
            "conversation_id": conversation_id,
            "agents": agents_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_conversation(conversation_id, message)
        
    async def send_heartbeat(self):
        """Send periodic heartbeats to keep connections alive"""
        while True:
            for conversation_id, connections in list(self.active_connections.items()):
                dead_connections = set()
                for connection in connections:
                    try:
                        await connection.send_json({"type": "heartbeat", "timestamp": datetime.utcnow().isoformat()})
                    except Exception as e:
                        logger.error(f"Error sending heartbeat: {str(e)}")
                        dead_connections.add(connection)
                
                # Clean up dead connections
                for dead in dead_connections:
                    await self.disconnect(dead, conversation_id)
            
            # Send heartbeat every 30 seconds
            await asyncio.sleep(30)

# Create a global connection manager
manager = ConnectionManager() 