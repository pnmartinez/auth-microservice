import { AuthenticationResult } from '@azure/msal-node';
import { azureClient, azureRedirectUri } from '../config/azure';
import { logger } from '../utils/logger.util';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { ValidationError } from '../utils/errors';

export class AzureService {
  async getAuthUrl(): Promise<string> {
    const authCodeUrlParameters = {
      scopes: ['openid', 'profile', 'email'],
      redirectUri: azureRedirectUri,
    };

    return azureClient.getAuthCodeUrl(authCodeUrlParameters);
  }

  async exchangeCodeForToken(code: string): Promise<AuthenticationResult> {
    try {
      const tokenRequest = {
        code,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: azureRedirectUri,
      };

      const response = await azureClient.acquireTokenByCode(tokenRequest);
      
      if (!response) {
        throw new Error('Failed to acquire token from Azure AD');
      }

      return response;
    } catch (error) {
      logger.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  async extractUserInfo(idToken: string): Promise<{ email: string; azureId: string; name?: string }> {
    try {
      // Get Azure tenant ID for JWKS URL
      const tenantId = process.env.AZURE_TENANT_ID || '';
      const jwksUrl = `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`;
      
      // Create JWKS client
      const JWKS = createRemoteJWKSet(new URL(jwksUrl));

      // Verify and decode the token
      const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
        audience: process.env.AZURE_CLIENT_ID,
      });

      // Validate required claims
      if (!payload.sub && !payload.oid) {
        throw new ValidationError('ID token missing subject claim');
      }

      const email = payload.email || payload.preferred_username;
      if (!email) {
        throw new ValidationError('ID token missing email claim');
      }

      return {
        email: email as string,
        azureId: (payload.sub || payload.oid) as string,
        name: payload.name as string | undefined,
      };
    } catch (error) {
      logger.error('Error verifying ID token:', error);
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Invalid or expired ID token');
    }
  }
}

export const azureService = new AzureService();

