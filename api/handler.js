const AWS = require("aws-sdk");
const { RekognitionClient, SearchFacesByImageCommand } = require("@aws-sdk/client-rekognition");
const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const rekognition = new RekognitionClient();
const dynamodb = new DynamoDBClient();
const s3 = new AWS.S3();

const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const rekognitionCollection = process.env.REKOGNITION_COLLECTION;
const dynamodbTable = process.env.DYNAMODB_TABLE_NAME;

// Constants
const FACE_MATCH_THRESHOLD = 80;

// <------- Register Face -------> //

module.exports.registerFace = async (event) => {
  console.log(event);

  const response = {
    isBase64Encoded: false,
    statusCode: 200,
    body: JSON.stringify({ message: "Face Is Successfully Registered!" }),
  };

  function generateRandomString(length) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      randomString += charset.charAt(randomIndex);
    }
    return randomString;
  }

  try {
    const parsedBody = JSON.parse(event.body);
    const metadata = parsedBody.person_name;
    const base64File = parsedBody.body;
    const decodedFile = Buffer.from(
      base64File.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    const params = {
      Bucket: BUCKET_NAME,
      Key: `index/${generateRandomString(10)}.jpg`,
      Body: decodedFile,
      ContentType: "binary/octet-stream",
      Metadata: {
        FullName: metadata,
      },
    };

    // Wait for the S3 upload to complete
    await s3.putObject(params).promise();

    response.body = JSON.stringify({
      message: "Face Successfully Registered",
    });
  } catch (error) {
    console.error(error);
    response.body = JSON.stringify({
      message: "Face failed to upload",
      errorMessage: error.message, // Include the specific error message
    });
    response.statusCode = 500;
  }

  return response;
};

// <------- Recognize Face -------> //

module.exports.recognizeFace = async (event) => {
  const response = {
    statusCode: 200,
    body: "",
  };

  try {
    const parsedBody = JSON.parse(event.body);
    const base64File = parsedBody.body;
    const image = Buffer.from(
      base64File.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const input = {
      CollectionId: rekognitionCollection,
      Image: { Bytes: image },
      FaceMatchThreshold: FACE_MATCH_THRESHOLD,
    };

    const searchFaceCommand = new SearchFacesByImageCommand(input);
    const rekognitionResult = await rekognition.send(searchFaceCommand);

    const { FaceMatches } = rekognitionResult;

    let found = false;
    let confidence = 0;
    let fullName = ''; // Initialize fullName

    for (const match of FaceMatches) {
      console.log(match.Face.FaceId, match.Similarity);

      const faceId = match.Face.FaceId;
      const currentConfidence = match.Similarity;

      const getItemCommand = new GetItemCommand({
        TableName: dynamodbTable,
        Key: { 'RekognitionId': { S: faceId } },
      });

      const face = await dynamodb.send(getItemCommand);

      if (face.Item && currentConfidence > confidence) {
        console.log("Found Person: ", face.Item.FullName.S);
        found = true;
        confidence = currentConfidence;
        fullName = face.Item.FullName.S; // Update fullName when a higher confidence is found
      }
    }

    response.body = JSON.stringify({
      message: "Found Face",
      face_found: found,
      confidence_score: confidence,
      full_name: found ? fullName : null, // Include the full_name in the response if found
    });
  } catch (error) {
    console.error(error);
    response.body = JSON.stringify({
      message: "Internal Server Error",
      errorMessage: error.message, // Include the specific error message
    });
    response.statusCode = 500;
  }

  return response;
};