BLACKLIGHT - Static demo website
================================
Files:
- index.html: homepage
- login.html: demo registration/login
- forms.html: encrypted local form archive placeholder
- admin.html: empty admin panel
- css/style.css: design
- js/: browser scripts

DEPLOY:
1. Upload the contents of this folder to the root of your GitHub repository.
2. GitHub repository > Settings > Pages.
3. Choose Deploy from a branch, select main and /(root), Save.
4. Open the Pages URL over HTTPS.

IMPORTANT SECURITY LIMITATIONS:
This project is a front-end-only demo for GitHub Pages.
- Accounts are stored in this browser's localStorage. They do NOT sync across devices/users.
- Passwords are PBKDF2-HMAC-SHA256 hashes with per-user random salts; original passwords are not stored.
- This is not production authentication. Anyone with access to the browser profile/devtools can alter local data or bypass client-side checks.
- Form encryption helper uses AES-256-GCM and PBKDF2. Encrypted records are local to the same browser.
- No private key or server-side secret can be hidden in GitHub Pages JavaScript.
- Never use a real/reused password or sensitive personal information with this demo.
- A true multi-user login and private form storage require a trusted backend.

ADDING A FORM LATER:
After login, include js/storage.js on a page and call:
await window.BlackLight.saveForm({title:"Example", message:"Hello"}, password);
The password is requested from the user at the time of encryption. Do not hardcode it.
