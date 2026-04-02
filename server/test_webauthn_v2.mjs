import { generateAuthenticationOptions } from '@simplewebauthn/server';

async function test() {
  const rpID = 'localhost';
  const idRaw = new Uint8Array([1, 2, 3, 4]);
  
  console.log('Testing with Uint8Array ID...');
  try {
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: [{
        id: idRaw,
        type: 'public-key',
      }],
      userVerification: 'preferred',
    });
    console.log('Success (Uint8Array)');
  } catch (err) {
    console.log('Failed (Uint8Array):', err.message);
  }

  console.log('Testing with base64url string ID...');
  try {
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: [{
        id: 'AQIDBA', // [1,2,3,4] in base64url
        type: 'public-key',
      }],
      userVerification: 'preferred',
    });
    console.log('Success (Base64URL String)');
  } catch (err) {
    console.log('Failed (Base64URL String):', err.message);
  }
}

test();
