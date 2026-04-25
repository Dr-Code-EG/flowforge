import { NodeDefinition } from '../types';

import { ManualTriggerNode } from './triggers/manual-trigger.node';
import { ScheduleTriggerNode } from './triggers/schedule-trigger.node';
import { WebhookTriggerNode } from './triggers/webhook-trigger.node';

import { HttpRequestNode } from './core/http-request.node';
import { SetNode } from './core/set.node';
import { CodeNode } from './core/code.node';
import { IfNode } from './core/if.node';
import { SwitchNode } from './core/switch.node';
import { MergeNode } from './core/merge.node';
import { SplitInBatchesNode } from './core/split-in-batches.node';
import { WaitNode } from './core/wait.node';
import { NoOpNode } from './core/noop.node';
import { JsonParseNode } from './core/json.node';
import { CsvParseNode } from './core/csv.node';
import { HtmlExtractNode } from './core/html-extract.node';
import { RssReadNode } from './core/rss.node';
import { ItemListsNode } from './core/item-lists.node';

import { EmailSendNode } from './communication/email.node';
import { SlackNode } from './communication/slack.node';
import { TelegramNode } from './communication/telegram.node';
import { DiscordNode } from './communication/discord.node';

import { PostgresNode } from './database/postgres.node';
import { MysqlNode } from './database/mysql.node';
import { MongoDbNode } from './database/mongodb.node';
import { RedisNode } from './database/redis.node';

import { OpenAiNode } from './ai/openai.node';

import { GithubNode } from './apps/github.node';
import { GoogleSheetsNode } from './apps/google-sheets.node';
import { S3Node } from './apps/s3.node';
import { FtpNode } from './apps/ftp.node';

export const ALL_NODES: NodeDefinition[] = [
  // Triggers
  ManualTriggerNode,
  ScheduleTriggerNode,
  WebhookTriggerNode,

  // Core
  HttpRequestNode,
  SetNode,
  CodeNode,
  IfNode,
  SwitchNode,
  MergeNode,
  SplitInBatchesNode,
  WaitNode,
  NoOpNode,
  JsonParseNode,
  CsvParseNode,
  HtmlExtractNode,
  RssReadNode,
  ItemListsNode,

  // Communication
  EmailSendNode,
  SlackNode,
  TelegramNode,
  DiscordNode,

  // Database
  PostgresNode,
  MysqlNode,
  MongoDbNode,
  RedisNode,

  // AI
  OpenAiNode,

  // Apps
  GithubNode,
  GoogleSheetsNode,
  S3Node,
  FtpNode,
];
