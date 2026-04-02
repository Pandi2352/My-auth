import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  generateRegistrationOptions, 
  verifyRegistrationResponse, 
  generateAuthenticationOptions, 
  verifyAuthenticationResponse,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse
} from '@simplewebauthn/server';
import { User, UserDocument } from '../user/schemas/user.schema.js';
import { ErrorEntity } from '../../utils/reponseUtils/ErrorEntity.js';
import { HttpStatus } from '../../utils/reponseUtils/httpStatus.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebAuthnService {
  private readonly logger = new Logger(WebAuthnService.name);
  private readonly rpName = 'Auth System';
  private readonly rpID: string;
  private readonly origin: string;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {
    this.rpID = this.configService.get<string>('WEBAUTHN_RP_ID', 'localhost');
    this.origin = this.configService.get<string>('WEBAUTHN_ORIGIN', 'http://localhost:5173');
  }

  async getRegistrationOptions(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new ErrorEntity({ http_code: HttpStatus.NOT_FOUND, error: 'user_not_found', error_description: 'User not found' });

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: new TextEncoder().encode(user._id.toString()),
      userName: user.email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'cross-platform', // Changed to cross-platform to allow Yubikeys too
      },
      excludeCredentials: user.authenticators.map(auth => ({
        id: auth.credentialID,
        type: 'public-key',
        transports: auth.transports,
      })),
    });

    // Store challenge on user object (or session)
    await this.userModel.findByIdAndUpdate(userId, { current_challenge: options.challenge });

    return options;
  }

  async verifyRegistration(userId: string, body: any) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.current_challenge) {
      throw new ErrorEntity({ http_code: HttpStatus.BAD_REQUEST, error: 'invalid_ceremony', error_description: 'Registration challenge not found' });
    }

    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge: user.current_challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
      });
    } catch (err: any) {
      this.logger.error(`Registration verification failed: ${err.message}`);
      throw new ErrorEntity({ http_code: HttpStatus.BAD_REQUEST, error: 'verification_failed', error_description: err.message });
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo;

      const newAuthenticator = {
        credentialID: Buffer.from(credential.id),
        credentialPublicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        credentialDeviceType,
        credentialBackedUp,
        transports: body.response.transports,
      };

      await this.userModel.findByIdAndUpdate(userId, {
        $push: { authenticators: newAuthenticator },
        $set: { current_challenge: null }
      });

      return { success: true, message: 'Passkey registered successfully' };
    }

    throw new ErrorEntity({ http_code: HttpStatus.BAD_REQUEST, error: 'verification_failed', error_description: 'Verification check failed' });
  }

  async getAuthenticationOptions(email?: string) {
    let user: UserDocument | null = null;
    if (email) {
      user = await this.userModel.findOne({ email });
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials: user?.authenticators.map(auth => ({
        id: auth.credentialID,
        type: 'public-key',
        transports: auth.transports,
      })),
      userVerification: 'preferred',
    });

    if (user) {
      await this.userModel.findByIdAndUpdate(user._id, { current_challenge: options.challenge });
    }

    return options;
  }

  async getAuthenticators(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new ErrorEntity({ http_code: HttpStatus.NOT_FOUND, error: 'user_not_found', error_description: 'User not found' });

    return user.authenticators.map(auth => ({
      credentialID: auth.credentialID.toString('base64url'),
      credentialDeviceType: auth.credentialDeviceType,
      credentialBackedUp: auth.credentialBackedUp,
      transports: auth.transports,
      counter: auth.counter,
    }));
  }

  async verifyAuthentication(body: any, email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user || !user.current_challenge) {
       throw new ErrorEntity({ http_code: HttpStatus.BAD_REQUEST, error: 'invalid_ceremony', error_description: 'Authentication challenge not found' });
    }

    const authenticator = user.authenticators.find(auth => 
      auth.credentialID.toString('base64url') === body.id || 
      auth.credentialID.toString('base64') === body.id
    );

    if (!authenticator) {
      throw new ErrorEntity({ http_code: HttpStatus.NOT_FOUND, error: 'authenticator_not_found', error_description: 'Authenticator not recognized for this user' });
    }

    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge: user.current_challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        credential: {
          id: authenticator.credentialID,
          publicKey: authenticator.credentialPublicKey,
          counter: authenticator.counter,
        },
      });
    } catch (err: any) {
      this.logger.error(`Authentication verification failed: ${err.message}`);
      throw new ErrorEntity({ http_code: HttpStatus.BAD_REQUEST, error: 'verification_failed', error_description: err.message });
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
      // Update counter
      await this.userModel.updateOne(
        { _id: user._id, 'authenticators.credentialID': authenticator.credentialID },
        { 
          $set: { 
            'authenticators.$.counter': authenticationInfo.newCounter,
            current_challenge: null 
          } 
        }
      );

      return { verified, user };
    }

    throw new ErrorEntity({ http_code: HttpStatus.BAD_REQUEST, error: 'verification_failed', error_description: 'Authentication check failed' });
  }

  async deleteAuthenticator(userId: string, credentialID: string) {
    // credentialID is passed as base64url string from frontend
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { authenticators: { credentialID: Buffer.from(credentialID, 'base64url') } }
    });
    return { success: true, message: 'Passkey deleted successfully' };
  }
}
