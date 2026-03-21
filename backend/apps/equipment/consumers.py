import json
from channels.generic.websocket import AsyncWebsocketConsumer


class EquipmentUpdatesConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # No authentication required for public equipment updates
        self.group_name = "equipment_updates"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({"type": "connection.ready"}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        return

    async def equipment_update(self, event):
        await self.send(
            text_data=json.dumps({
                "type": "equipment_update",
                "action": event["action"],  # 'created', 'updated', 'deleted'
                "equipment_id": event["equipment_id"],
                "data": event.get("data"),
            })
        )