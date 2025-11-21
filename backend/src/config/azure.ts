import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';

const azureConfig: Configuration = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID || '',
    authority: process.env.AZURE_AUTHORITY || `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET || '',
  },
};

export const azureClient = new ConfidentialClientApplication(azureConfig);

export const azureRedirectUri = process.env.AZURE_REDIRECT_URI || '';

