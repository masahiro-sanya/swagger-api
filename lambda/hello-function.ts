import { Handler } from 'aws-lambda';

export const handler: Handler = async (event, context) => {
    console.log('EVENT: \n' + JSON.stringify(event, null, 2));
    const queryParams = event.queryStringParameters;
    const body = {
        code: 'success',
        message: queryParams?.name
            ? `Hello ${queryParams.name}`
            : 'Hello World!',
    };

    const response = {
        isBase64Encoded: false,
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(body),
    };
    return response;
};
