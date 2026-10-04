import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import P from "pino";
import http from "node:http";
async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("🤖 HOUSE BOT ONLINE!");
    }

    if (connection === "close") {
      const deveReconectar =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      if (deveReconectar) {
        console.log("🔄 Reconectando...");
        iniciarBot();
      } else {
        console.log("❌ Sessão encerrada.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const comando = texto.trim().toLowerCase();

    if (comando === "!menu") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
`╔══════════════════╗
     🤖 HOUSE BOT
╚══════════════════╝

👋 Olá! Eu sou o bot da House.

📋 COMANDOS

!menu
!ping
!regras

🔥 Em breve teremos muito mais comandos!`
      });
    }

    if (comando === "!ping") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🏓 PONG! O House Bot está online! 🤖🔥"
      });
    }

    if (comando === "!regras") {
      await sock.sendMessage(msg.key.remoteJid, {
        text:
`📜 REGRAS DA HOUSE

1️⃣ Respeite os membros.
2️⃣ Nada de spam.
3️⃣ Nada de conteúdo proibido.
4️⃣ Respeite os ADMs.
5️⃣ Divirta-se. 🖤`
      });
    }
  });
}

iniciarBot();
const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("HOUSE BOT ONLINE 🤖");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Servidor HTTP na porta ${PORT}`);
});
