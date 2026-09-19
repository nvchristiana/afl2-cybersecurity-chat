# 🔒 AFL 2 Cyber Security - Secure Chat Application

A real-time secure chat application built with Node.js, Express, Socket.io, and Cryptographic Algorithms (SHA-256 Hashing & RSA Asymmetric Encryption).

---

## 📹 Video Demonstration
📺 Watch the full demonstration on YouTube: [https://youtu.be/IO6YnPv4H0U](https://youtu.be/IO6YnPv4H0U)

---

## 🛡️ Key Features & Security Implementations

1. **Data Integrity (Assignment #1)**
   * Uses **SHA-256 Hashing** to detect tampered or modified messages sent by a compromised/malicious server (`malicious-server.js`).

2. **Authentication & Non-Repudiation (Assignment #2)**
   * Uses **RSA Digital Signatures** to verify the sender's real identity and detect impersonation attempts (`!impersonate`).

3. **Confidentiality & E2EE (Assignment #3)**
   * Uses **RSA Asymmetric Encryption** for secret messaging (`!secret <username>`). Messages are encrypted using the recipient's Public Key, ensuring only the intended recipient can decrypt and read the message.

---

## 🚀 How to Run Locally

1. **Clone repository:**
   ```bash
   git clone [https://github.com/nvchristiana/afl2-cybersecurity-chat.git](https://github.com/nvchristiana/afl2-cybersecurity-chat.git)
   cd afl2-cybersecurity-chat
