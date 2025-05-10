import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from 'uuid';


export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const region = process.env.AWS_REGION!;
    const bucket = process.env.BUCKET_NAME!;
    const s3 = new S3Client({ region });

    const generatedKey: string = `${uuid()}`; 
    const ContentType = event.queryStringParameters?.cType

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: generatedKey,  
      ContentType
    });

    const signedUrl : string = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const hostedUrl : string = `https://${bucket}.s3.${region}.amazonaws.com/${generatedKey}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully created presigned URL for upload.Make sure to send the content type on the header.',
        uploadUrl: signedUrl,
        hostedUrl, 
        ContentType
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error generating presigned URL',
      }),
    };
  }
};
