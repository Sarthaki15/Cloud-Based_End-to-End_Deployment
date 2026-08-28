/**
 * dynamo.js — Data tier access layer
 * ---------------------------------------------------------
 * Wraps DynamoDB (AWS SDK v3) so route handlers never touch
 * AWS SDK calls directly. In production, the EC2/ECS/Elastic
 * Beanstalk instance role should have IAM permissions:
 *   dynamodb:GetItem, PutItem, Query, Scan, DeleteItem, UpdateItem
 * scoped to the two tables below (see README for the IAM policy).
 * ---------------------------------------------------------
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

const MENU_TABLE = process.env.DYNAMO_MENU_TABLE || "CafeMenuItems";
const ORDERS_TABLE = process.env.DYNAMO_ORDERS_TABLE || "CafeOrders";

export async function listMenuItems() {
  const result = await docClient.send(new ScanCommand({ TableName: MENU_TABLE }));
  return result.Items || [];
}

export async function putMenuItem(item) {
  await docClient.send(new PutCommand({ TableName: MENU_TABLE, Item: item }));
  return item;
}

export async function createOrder(order) {
  await docClient.send(new PutCommand({ TableName: ORDERS_TABLE, Item: order }));
  return order;
}

export async function listOrdersForUser(userSub) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: ORDERS_TABLE,
      IndexName: "userSub-index", // GSI on userSub, see README
      KeyConditionExpression: "userSub = :u",
      ExpressionAttributeValues: { ":u": userSub },
      ScanIndexForward: false,
    })
  );
  return result.Items || [];
}

export { MENU_TABLE, ORDERS_TABLE };
