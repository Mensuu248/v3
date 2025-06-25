const fs = require("fs");
const chalk = require("chalk");

// Fungsi generate email acak + domain realistis
function generateRandomEmail() {
  const username = Math.random().toString(36).substring(2, 10);
  const domains = [
    "cuvox.de",
    "gustr.com",
    "jourrapide.com",
    "rhyta.com",
    "dayrep.com",
    "armyspy.com",
    "superrito.com",
    "teleworm.us",
    "fleckens.hu",
    "einrot.com",
    "meltmail.com",
    "mailinator.com",
    "sharklasers.com",
    "lolito.email",
    "grr.la",
  ];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${username}@${domain}`;
}

// Buat akun dan simpan
function generateAccount() {
  const email = generateRandomEmail();
  const output = `Email: ${email}\nPassword: 12345678\n`;
  fs.appendFileSync("accounts.txt", output + "\n");
  console.log(output);
}

generateAccount();
