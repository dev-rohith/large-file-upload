import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { lambdaHandler } from '../../app';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from 'uuid';

process.env.AWS_REGION = 'us-east-1';
process.env.BUCKET_NAME = 'my-serverless-rohith-s3bucket-large-upload';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn()
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  PutObjectCommand: jest.fn()
}));

jest.mock('uuid', () => ({
  v4: jest.fn()
}));


const mockUUID = '1234-uuid-test';
const mockSignedUrl = 'https://signed.url/mock';

const baseEvent: APIGatewayProxyEvent = {
  httpMethod: 'get',
  body: '',
  headers: {},
  isBase64Encoded: false,
  multiValueHeaders: {},
  multiValueQueryStringParameters: {},
  path: '/get-presigned-url',
  pathParameters: {},
  queryStringParameters: { cType: 'image/png' },
  requestContext: {
    accountId: '123456789012',
    apiId: '1234',
    authorizer: {},
    httpMethod: 'get',
    identity: {
      accessKey: '',
      accountId: '',
      apiKey: '',
      apiKeyId: '',
      caller: '',
      clientCert: {
        clientCertPem: '',
        issuerDN: '',
        serialNumber: '',
        subjectDN: '',
        validity: { notAfter: '', notBefore: '' },
      },
      cognitoAuthenticationProvider: '',
      cognitoAuthenticationType: '',
      cognitoIdentityId: '',
      cognitoIdentityPoolId: '',
      principalOrgId: '',
      sourceIp: '',
      user: '',
      userAgent: '',
      userArn: '',
    },
    path: '/get-presigned-url',
    protocol: 'HTTP/1.1',
    requestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
    requestTimeEpoch: 1428582896000,
    resourceId: '123456',
    resourcePath: '/get-presigned-url',
    stage: 'dev',
  },
  resource: '',
  stageVariables: {},
};

describe('Unit tests for lambdaHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (uuid as jest.Mock).mockReturnValue(mockUUID);
    (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);
  });

  it('should return 200 and signed URLs when successful', async () => {
    const result: APIGatewayProxyResult = await lambdaHandler(baseEvent);

    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: 'my-serverless-rohith-s3bucket-large-upload',
      Key: mockUUID,
      ContentType: 'image/png',
    });

    expect(getSignedUrl).toHaveBeenCalled();

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);

    expect(body).toMatchObject({
      message: expect.stringContaining('Successfully created'),
      uploadUrl: mockSignedUrl,
      hostedUrl: `https://my-serverless-rohith-s3bucket-large-upload.s3.us-east-1.amazonaws.com/${mockUUID}`,
      ContentType: 'image/png',
    });
  });

  it('should return 500 on error', async () => {
    (getSignedUrl as jest.Mock).mockRejectedValue(new Error('S3 error'));

    const result: APIGatewayProxyResult = await lambdaHandler(baseEvent);
    expect(result.statusCode).toBe(500);

    const body = JSON.parse(result.body);
    expect(body).toEqual({
      message: 'Error generating presigned URL',
    });
  });
});
