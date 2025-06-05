import json
from channels.generic.websocket import AsyncWebsocketConsumer

USER_CHANNELS = {}

class PrivateChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.username = self.scope["url_route"]["kwargs"]["username"]
        USER_CHANNELS[self.username] = self.channel_name
        await self.accept()

    async def disconnect(self, close_code):
        USER_CHANNELS.pop(self.username, None)

    async def receive(self, text_data):
        data = json.loads(text_data)
        to_user = data.get("to")

        if to_user in USER_CHANNELS:
            await self.channel_layer.send(
                USER_CHANNELS[to_user],
                {
                    "type": "forward.message",
                    "message": data
                }
            )

    async def forward_message(self, event):
        await self.send(text_data=json.dumps(event["message"]))
