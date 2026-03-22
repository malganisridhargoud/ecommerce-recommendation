import json

from channels.generic.websocket import AsyncWebsocketConsumer

from .notifications import buyer_booking_group, vendor_booking_group


class BookingEventsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        role = self.scope["url_route"]["kwargs"]["role"]
        user_id = self.scope["url_route"]["kwargs"]["user_id"]

        if not user or not getattr(user, "is_authenticated", False):
            await self.close(code=4401)
            return

        if str(user.id) != user_id:
            await self.close(code=4403)
            return

        # Accept connection based on URL role — don't gate on the user's
        # *database* role because users can switch roles and a vendor may
        # also browse as a buyer.
        if role == "vendor":
            self.group_name = vendor_booking_group(user_id)
        elif role == "buyer":
            self.group_name = buyer_booking_group(user_id)
        else:
            await self.close(code=4404)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({"type": "connection.ready", "role": role}))

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        return

    async def booking_event(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "booking.event",
                    "event": event["event"],
                    "actor": event["actor"],
                    "timestamp": event["timestamp"],
                    "booking": event["booking"],
                }
            )
        )
