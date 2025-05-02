import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from 'uuid';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const s3 = new S3Client({ region: "us-east-1" });
        const generatedKey: string = `${uuid()}`;
        const contentType = event.headers['Content-Type']
        
        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: generatedKey,
            ContentType: contentType
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Successfully created presigned URL for upload',
                uploadUrl: signedUrl,
                objectKey: generatedKey,
                contentType
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
