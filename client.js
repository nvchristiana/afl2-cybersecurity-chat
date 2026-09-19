const io = require("socket.io-client");
const readline = require("readline");
const crypto = require("crypto");

const socket = io("http://localhost:3000");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});

let targetUsername = "";
let username = "";
const users = new Map();

// 1. Generate Pasangan Kunci RSA (Public & Private Key) untuk Client ini
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

// Fungsi enkripsi pesan menggunakan Public Key Target
function encryptMessage(plaintext, recipientPublicKey) {
  try {
    const buffer = Buffer.from(plaintext, "utf8");
    const encrypted = crypto.publicEncrypt(recipientPublicKey, buffer);
    return encrypted.toString("hex");
  } catch (e) {
    console.log("Encryption failed:", e.message);
    return null;
  }
}

// Fungsi dekripsi pesan menggunakan Private Key sendiri
function decryptMessage(ciphertextHex, myPrivateKey) {
  try {
    const buffer = Buffer.from(ciphertextHex, "hex");
    const decrypted = crypto.privateDecrypt(myPrivateKey, buffer);
    return decrypted.toString("utf8");
  } catch (e) {
    return "[Decryption Failed]";
  }
}

socket.on("connect", () => {
  console.log("Connected to the server");

  rl.question("Enter your username: ", (input) => {
    username = input;
    console.log(`Welcome, ${username} to the chat`);

    // Daftarkan Public Key ke server
    socket.emit("registerPublicKey", {
      username,
      publicKey,
    });
    rl.prompt();

    rl.on("line", (message) => {
      if (message.trim()) {
        let match;
        if ((match = message.match(/^!secret (\w+)$/))) {
          targetUsername = match[1];
          console.log(`Now secretly chatting with ${targetUsername}`);
        } else if (message.match(/^!exit$/)) {
          console.log(`No more secretly chatting with ${targetUsername}`);
          targetUsername = "";
        } else {
          // Jika mode secret aktif, enkripsi pesan dengan Public Key target
          if (targetUsername) {
            const targetPublicKey = users.get(targetUsername);

            if (!targetPublicKey) {
              console.log(`[ERROR] User '${targetUsername}' not found or public key unavailable.`);
            } else {
              const encryptedMsg = encryptMessage(message, targetPublicKey);
              if (encryptedMsg) {
                socket.emit("message", {
                  username,
                  targetUsername,
                  message: encryptedMsg,
                  isEncrypted: true,
                });
              }
            }
          } else {
            // Pesan biasa tanpa enkripsi
            socket.emit("message", {
              username,
              targetUsername: "",
              message,
              isEncrypted: false,
            });
          }
        }
      }
      rl.prompt();
    });
  });
});

socket.on("init", (keys) => {
  keys.forEach(([user, key]) => users.set(user, key));
  console.log(`\nThere are currently ${users.size} users in the chat`);
  rl.prompt();
});

socket.on("newUser", (data) => {
  const { username: newUsername, publicKey: newKey } = data;
  users.set(newUsername, newKey);
  if (newUsername !== username) {
    console.log(`\n${newUsername} joined the chat`);
  }
  rl.prompt();
});

socket.on("message", (data) => {
  const { username: senderUsername, targetUsername: target, message: msgContent, isEncrypted } = data;

  if (senderUsername !== username) {
    if (isEncrypted) {
      if (target === username) {
        // Hanya penerima target yang bisa mendekripsi pesan rahasia
        const decryptedMsg = decryptMessage(msgContent, privateKey);
        console.log(`\n[SECRET from ${senderUsername}]: ${decryptedMsg}`);
      } else {
        // User lain yang tidak berhak hanya melihat ciphertext (teks acak/gibberish)
        console.log(`\n[ENCRYPTED MSG from ${senderUsername} to ${target}]: ${msgContent}`);
      }
    } else {
      // Pesan publik biasa
      console.log(`\n${senderUsername}: ${msgContent}`);
    }
    rl.prompt();
  }
});

socket.on("disconnect", () => {
  console.log("Server disconnected, Exiting...");
  rl.close();
  process.exit(0);
});

rl.on("SIGINT", () => {
  console.log("\nExiting...");
  socket.disconnect();
  rl.close();
  process.exit(0);
});