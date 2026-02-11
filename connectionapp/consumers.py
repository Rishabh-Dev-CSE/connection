import json
import uuid
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


waiting_users = []


class OmegleConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        print("connected")
        await self.accept()

        self.room = None
        self.role = None

        await self.match_user()

    async def match_user(self):
        global waiting_users

        if waiting_users:
            partner = waiting_users.pop(0)

            room_id = str(uuid.uuid4())[:8]
            group = f"video_{room_id}"

            self.room = room_id
            partner.room = room_id

            # roles
            self.role = "answer"
            partner.role = "offer"

            # join group
            await self.channel_layer.group_add(group, self.channel_name)
            await self.channel_layer.group_add(group, partner.channel_name)

            # send role to both
            await self.send(json.dumps({
                "type": "matched",
                "role": self.role
            }))

            await self.channel_layer.send(
                partner.channel_name,
                {
                    "type": "send_role",
                    "role": partner.role
                }
            )

        else:
            waiting_users.append(self)
            await self.send(json.dumps({"type": "searching"}))

    async def send_role(self, event):
        await self.send(json.dumps({
            "type": "matched",
            "role": event["role"]
        }))

    async def receive(self, text_data):
        data = json.loads(text_data)
        print("SIGNAL:", data)  

        # NEXT
        if data.get("type") == "next":
            await self.match_user()
            return

        # SIGNALING
        if data.get("type") in ["offer", "answer", "ice"]:
            if not self.room:
                return

            await self.channel_layer.group_send(
                f"video_{self.room}",
                {
                    "type": "signal",
                    "data": data,
                    "sender": self.channel_name
                }
            )

    async def signal(self, event):
        if event["sender"] == self.channel_name:
            return

        await self.send(json.dumps(event["data"]))

    async def disconnect(self, close_code):
        pass