const socket = io();

let myUsername = "";
let targetUsername = "";
let crypt = new JSEncrypt({ default_key_size: 1024 });

// Generate RSA Keypair di Browser
crypt.getKey();
const myPublicKey = crypt.getPublicKey();
const myPrivateKey = crypt.getPrivateKey();

const users = new Map();

function joinChat() {
  const input = document.getElementById("username-input").value.trim();
  if (!input) return alert("Username tidak boleh kosong!");

  myUsername = input;
  document.getElementById("login-card").classList.add("hidden");
  document.getElementById("chat-container").classList.remove("hidden");
  document.getElementById("room-title").innerText = `Selamat Datang, ${myUsername}!`;

  socket.emit("registerPublicKey", { username: myUsername, publicKey: myPublicKey });
}

socket.on("init", (keys) => {
  keys.forEach(([user, key]) => users.set(user, key));
  updateUserList();
});

socket.on("newUser", (data) => {
  users.set(data.username, data.publicKey);
  updateUserList();
});

function updateUserList() {
  document.getElementById("user-list").innerText = `Users Online (${users.size}): ${Array.from(users.keys()).join(", ")}`;
}

function handleKeyPress(e) {
  if (e.key === "Enter") sendMessage();
}

function sendMessage() {
  const inputElem = document.getElementById("message-input");
  const text = inputElem.value.trim();
  if (!text) return;

  let match;
  if ((match = text.match(/^!secret (\w+)$/i))) {
    targetUsername = match[1];
    appendMessage("SYSTEM", `Sekarang pesan rahasia aktif ke '${targetUsername}'`, "system");
  } else if (text.match(/^!exit$/i)) {
    appendMessage("SYSTEM", `Secret chat nonaktif`, "system");
    targetUsername = "";
  } else {
    if (targetUsername) {
      // Cari user tanpa mempedulikan huruf besar/kecil (case-insensitive)
      const actualUserKey = Array.from(users.keys()).find(
        (u) => u.toLowerCase() === targetUsername.toLowerCase()
      );
      const targetPublicKey = users.get(actualUserKey);

      if (!targetPublicKey) {
        appendMessage("SYSTEM", `User '${targetUsername}' tidak ditemukan!`, "warning");
      } else {
        const encryptor = new JSEncrypt();
        encryptor.setPublicKey(targetPublicKey);
        const encryptedMsg = encryptor.encrypt(text);

        // Hash dihitung dari ciphertext yang dikirim
        const hash = CryptoJS.SHA256(encryptedMsg).toString();

        socket.emit("message", {
          username: myUsername,
          targetUsername: actualUserKey,
          message: encryptedMsg,
          isEncrypted: true,
          hash
        });
        appendMessage(`Secret to ${actualUserKey}`, text, "me secret");
      }
    } else {
      // Hash dihitung dari teks biasa
      const hash = CryptoJS.SHA256(text).toString();

      socket.emit("message", {
        username: myUsername,
        targetUsername: "",
        message: text,
        isEncrypted: false,
        hash
      });
      appendMessage("Me", text, "me");
    }
  }

  inputElem.value = "";
}

socket.on("message", (data) => {
  const { username, targetUsername: target, message, isEncrypted, hash } = data;
  if (username === myUsername) return;

  // Verifikasi Hash SHA-256 dari konten pesan yang diterima
  const computedHash = CryptoJS.SHA256(message).toString();
  if (hash && computedHash !== hash) {
    appendMessage(`WARNING [${username}]`, `Pesan mungkin diubah oleh Server! Content: "${message}"`, "warning");
    return;
  }

  if (isEncrypted) {
    if (target === myUsername) {
      const decryptor = new JSEncrypt();
      decryptor.setPrivateKey(myPrivateKey);
      const decrypted = decryptor.decrypt(message);
      appendMessage(`SECRET from ${username}`, decrypted || "[Gagal Dekripsi]", "secret");
    } else {
      appendMessage(`ENCRYPTED [${username} ➔ ${target}]`, message, "system");
    }
  } else {
    appendMessage(username, message, "other");
  }
});

function appendMessage(sender, text, type) {
  const msgBox = document.getElementById("messages");
  const card = document.createElement("div");
  card.className = `msg-card ${type}`;

  card.innerHTML = `
    <div class="msg-header">${sender}</div>
    <div class="msg-body">${text}</div>
  `;

  msgBox.appendChild(card);
  msgBox.scrollTop = msgBox.scrollHeight;
}