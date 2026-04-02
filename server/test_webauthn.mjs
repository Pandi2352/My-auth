import { generateAuthenticationOptions } from '@simplewebauthn/server';

async function test() {
  try {
    const options = await generateAuthenticationOptions({
      rpID: 'localhost',
      allowCredentials: [
        {
          id: new Uint8Array([1, 2, 3, 4]),
          type: 'public-key',
          transports: ['usb', 'ble', 'nfc', 'internal'],
        }
      ],
      userVerification: 'preferred',
    });
    console.log('Options generated successfully');
    console.log(JSON.stringify(options, null, 2));
  } catch (error) {
    console.error('Generation failed:', error);
  }
}

test();
