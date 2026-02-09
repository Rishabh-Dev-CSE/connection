import json
from channels.generic.websocket import AsyncWebsocketConsumer
class WriterBoard(AsyncWebsocketConsumer):

    async def connect(self):
        self.room = self.scope["url_route"]["kwargs"]["room"]
        self.group = f"room_{self.room}"

        print("WS CONNECTED:", self.room)

        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

    async def receive(self, text_data):
        
        await self.channel_layer.group_send(
            self.group,
            {
                "type": "forward",
                "data": text_data
            }
        )

    async def forward(self, event):
        await self.send(text_data=event["data"])


class VideoCallConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room = self.scope["url_route"]["kwargs"]["room"]
        self.group = f"video_{self.room}"

        await self.channel_layer.group_add(
            self.group,
            self.channel_name
        )

        await self.accept()

        # notify others someone joined
        await self.channel_layer.group_send(
            self.group,
            {
                "type": "system_message",
                "event": "join",
                "sender": self.channel_name
            }
        )

        print(f"[VIDEO] CONNECTED → {self.room}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group,
            self.channel_name
        )

        await self.channel_layer.group_send(
            self.group,
            {
                "type": "system_message",
                "event": "leave",
                "sender": self.channel_name
            }
        )

        print(f"[VIDEO] DISCONNECTED → {self.room}")

    async def receive(self, text_data):
        """
        Receives WebRTC signaling messages:
        offer / answer / ice
        """
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get("type")

        if msg_type not in ("offer", "answer", "ice"):
            return

        await self.channel_layer.group_send(
            self.group,
            {
                "type": "signal_message",
                "data": data,
                "sender": self.channel_name
            }
        )

    async def signal_message(self, event):
        """
        Forward signaling data to other peer only
        """
        if self.channel_name == event["sender"]:
            return

        await self.send(text_data=json.dumps(event["data"]))

    async def system_message(self, event):
        """
        Join / leave notification (optional but premium)
        """
        if self.channel_name == event["sender"]:
            return

        await self.send(text_data=json.dumps({
            "type": "system",
            "event": event["event"]
        }))
