const bcrypt = require('bcrypt');

const storedHash = '$2b$10$hfhVcTiDGr85QeOToCJ7mO.onQ7uyTsYDvRD3KHZ.d8ilRaeUNhpa';
const frontendPassword = '@TALeNtShieLD!?642';

console.log('Testing password:', frontendPassword);
const isMatch = bcrypt.compareSync(frontendPassword, storedHash);
console.log('Match:', isMatch ? '✅ YES' : '❌ NO');

if (!isMatch) {
  bcrypt.hash(frontendPassword, 10).then(hash => {
    console.log('\n✅ Use this hash in MongoDB:');
    console.log(hash);
  });
}
