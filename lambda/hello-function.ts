import { Handler } from 'aws-lambda';

export const handler: Handler = async (event, context) => {
    console.log('EVENT: \n' + JSON.stringify(event, null, 2));
    const body = {
        code: 'success',
        message: 'registered',
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
